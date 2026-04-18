# syntax=docker/dockerfile:1.7

# Create base image with dependencies
# needed by both builder and final
FROM debian:bookworm as base-image

RUN set -xe; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update && apt-get install -y \
    libmariadb-dev \
    libmariadb-dev-compat \
    liblua5.3-dev \
    libdb5.3-dev \
    libssl-dev \
    libboost-all-dev \
    libcpprest-dev \
    libjemalloc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY scripts /app/scripts
RUN ln -s /app/scripts/swgemu.sh /usr/bin/swgemu

# Create builder image from base and add
# needed items for building the project
FROM base-image as build-image
RUN set -xe; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    cmake \
    ninja-build \
    git \
    default-jre \
    curl \
    wget \
    gnupg \
    lsb-release \
    software-properties-common \
    g++ \
    gcc \
    ccache \
    && rm -rf /var/lib/apt/lists/*

# Install Clang via LLVM script (same as upstream)
RUN set -xe; \
    wget -O /tmp/llvm.sh https://apt.llvm.org/llvm.sh; \
    chmod +x /tmp/llvm.sh; \
    /tmp/llvm.sh all || /tmp/llvm.sh all; \
    (set +x; cd /usr/bin; for i in ../lib/llvm-*/bin/*; do ln -sfv $i .; done); \
    clang --version; \
    ld.lld --version; \
    rm -rf /var/lib/apt/lists/*

# builder image to build Core3
# this is separate to facilicate using
# the prior layer for local development
FROM build-image as builder

RUN curl -L https://github.com/krallin/tini/releases/download/v0.19.0/tini -o /usr/bin/tini

WORKDIR /app
COPY ./Core3 .

# This is a hack to make the /app folder the root of it's own
# git repo. Without this section git will treat is as a submodule
# of swgemu-docker but will be missing the .git folder and fail all git commands
RUN rm .git
COPY .git/modules/Core3/. .git/
RUN sed -i 's/..\/..\/Core3\///' .git/modules/MMOCoreORB/utils/engine3/config && \
    sed -i 's/worktree.*//' .git/config && \
    sed -i 's/..\/.git\/modules\/Core3\//.git\//' MMOCoreORB/utils/engine3/.git

WORKDIR /app/MMOCoreORB

ENV CCACHE_DIR=/root/.ccache \
    CCACHE_MAXSIZE=20G \
    CCACHE_COMPILERCHECK=content

# RUN make build-ninja-debug NINJA_ARGS="-j10" CMAKE_ARGS="-DENABLE_REST_SERVER=ON"
RUN --mount=type=cache,target=/root/.ccache,id=swgemu-ccache \
    --mount=type=cache,target=/app/MMOCoreORB/build,id=swgemu-build \
    make build-ninja-debug NINJA_ARGS="" CMAKE_ARGS="-DENABLE_REST_SERVER=ON" \
    && ccache -s


# Create final image that could be used as a
# lighter-weight production image
FROM base-image as final

COPY --from=builder /usr/bin/tini /usr/bin/tini
RUN chmod a+x /usr/bin/tini

WORKDIR /app/MMOCoreORB/bin
COPY --from=builder /app/MMOCoreORB/bin .

# tini is needed as core3 does not explicitly handle SIGTERM signals
ENTRYPOINT ["tini", "--"]
CMD ["swgemu", "start"]

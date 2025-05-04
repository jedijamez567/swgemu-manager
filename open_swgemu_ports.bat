@echo off
echo Creating firewall rules for SWGEmu Docker ports...

REM MySQL Port
netsh advfirewall firewall add rule name="SWGEmu MySQL 3306" dir=in action=allow protocol=TCP localport=3306 profile=private

REM SWGEmu Game Ports - TCP
netsh advfirewall firewall add rule name="SWGEmu Game 44419 TCP" dir=in action=allow protocol=TCP localport=44419 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44453 TCP" dir=in action=allow protocol=TCP localport=44453 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44462 TCP" dir=in action=allow protocol=TCP localport=44462 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44463 TCP" dir=in action=allow protocol=TCP localport=44463 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44455 TCP" dir=in action=allow protocol=TCP localport=44455 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44460 TCP" dir=in action=allow protocol=TCP localport=44460 profile=private

REM SWGEmu Game Ports - UDP
netsh advfirewall firewall add rule name="SWGEmu Game 44419 UDP" dir=in action=allow protocol=UDP localport=44419 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44453 UDP" dir=in action=allow protocol=UDP localport=44453 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44462 UDP" dir=in action=allow protocol=UDP localport=44462 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44463 UDP" dir=in action=allow protocol=UDP localport=44463 profile=private
netsh advfirewall firewall add rule name="SWGEmu Game 44455 UDP" dir=in action=allow protocol=UDP localport=44455 profile=private

REM REST API Port
netsh advfirewall firewall add rule name="SWGEmu REST API 44443" dir=in action=allow protocol=TCP localport=44443 profile=private

echo All firewall rules created successfully!

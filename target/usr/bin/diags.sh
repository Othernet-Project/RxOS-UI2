#!/bin/sh

cat /etc/motd

echo
echo $(date) $(uptime | sed 's/.* up/up/')
echo
free
echo
df -Pkh /mnt/downloads/ | grep /mnt/downloads
echo
ip -4 addr  show wlan0
echo

if pgrep "tuner.bin" > /dev/null
then
  echo "[ OK ] Tuner is running"
else
  echo "[FAIL] Tuner is not running. You should reboot"
fi

w=$(cat /var/log/messages | grep spi | grep timeout | tail -n 5 | awk '{print "       " $0 }' | wc -l)
if [[ "$w" -gt 0 ]]
then
  echo
  echo "       Last few h/w reports:"
  echo
  cat /var/log/messages | grep spi | grep timeout | sed 's/othernet .* spi_master/spi_master/' | tail -n 5 | awk '{print "       " $0 }'
  echo
fi

if pgrep "audio_server" > /dev/null
then
  echo "[ OK ] Audio service is running"
else
  echo "[FAIL] Audio service is not running. You should reboot"
fi

if pgrep "aplay" > /dev/null
then
  echo "[ OK ] Local audio is running"
else
  echo "[FAIL] Local audio is not running."
fi

if grep -q 'BOARDID=e' /proc/cmdline
then
  if pgrep "lcdui" > /dev/null
  then
    echo "[ OK ] LCD UI is running"
  else
    echo "[FAIL] LCD UI is not running. You should reboot."
  fi
fi

if pgrep "ondd" > /dev/null
then
  echo "[ OK ] File service is running"
else
  echo "[FAIL] File service is not running. You should reboot"
fi

echo
echo "       Last few updates from file service:"
echo
cat /var/log/messages | grep ondd | tail -n 5 | sed 's/othernet .* completed/completed/' | awk '{print "       " $0}'
echo

lnbs=$(i2cget -y 0 0x60 0x00)
[[ $(( $lnbs >> 3 & 0x1 )) -eq 1 ]] && echo "[ OK ] Bias-T is configured on: $lnbs"
[[ $(( $lnbs >> 3 & 0x1 )) -eq 0 ]] && echo "[FAIL] Bias-T is NOT configured on: $lnbs"
[[ $(( $lnbs & 0x7 )) -eq 0 ]] && echo "[ OK ] Bias-T voltage is set to 13V"
[[ $(( $lnbs & 0x7 )) -eq 1 ]] && echo "[ OK ] Bias-T voltage is set to 13.4V"
[[ $(( $lnbs & 0x7 )) -eq 2 ]] && echo "[ OK ] Bias-T voltage is set to 13.8V"
[[ $(( $lnbs & 0x7 )) -eq 3 ]] && echo "[ OK ] Bias-T voltage is set to 14.2V"
[[ $(( $lnbs & 0x7 )) -eq 4 ]] && echo "[ OK ] Bias-T voltage is set to 18V"
[[ $(( $lnbs & 0x7 )) -eq 5 ]] && echo "[ OK ] Bias-T voltage is set to 18.6V"
[[ $(( $lnbs & 0x7 )) -eq 6 ]] && echo "[ OK ] Bias-T voltage is set to 19.2V"
[[ $(( $lnbs & 0x7 )) -eq 7 ]] && echo "[ OK ] Bias-T voltage is set to 19.8V"

lnbs=$(i2cget -y 0 0x60 0x02)
[[ $(( $lnbs >> 5 & 0x1 )) -eq 1 ]] && echo "[ OK ] LNB power is configured on"
[[ $(( $lnbs >> 6 & 0x1 )) -eq 1 ]] && echo "[FAIL] LNB power chip is overheating!"
[[ $(( $lnbs >> 3 & 0x1 )) -eq 1 ]] && echo "[FAIL] LNB power chip is in thermal shutdown!"
[[ $(( $lnbs >> 2 & 0x1 )) -eq 1 ]] && echo "[FAIL] LNB power chip shutdown due to overcurrent: You probably have a short in your RF cable!"
[[ $(( $lnbs >> 1 & 0x1 )) -eq 0 ]] && echo "[FAIL] No/Very little current flowing on the Bias-T: Is your LNB connected? : $lnbs"
[[ $(( $lnbs >> 1 & 0x1 )) -eq 1 ]] && echo "[ OK ] LNB detected, normal current flow: $lnbs"
[[ $(( $lnbs & 0x1 )) -eq 1 ]] && echo "[ OK ] Bias-T Voltage normal"
[[ $(( $lnbs & 0x1 )) -eq 0 ]] && echo "[FAIL] Bias-T Voltage out of range: check your power supply, cable shorts etc"


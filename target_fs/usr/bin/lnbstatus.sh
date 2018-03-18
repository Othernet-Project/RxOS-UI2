#!/bin/sh

lnbs=$(i2cget -y 0 0x60 0x00)
echo "BiasT Config: $lnbs"
echo
[[ $(( $lnbs >> 3 & 0x1 )) -eq 1 ]] && echo "[ok] BiasT is configured on"
[[ $(( $lnbs >> 3 & 0x1 )) -eq 0 ]] && echo "[fail] BiasT is NOT configured on"
[[ $(( $lnbs & 0x7 )) -eq 0 ]] && echo "[ok] BiasT voltage is set to 13V"
[[ $(( $lnbs & 0x7 )) -eq 1 ]] && echo "[ok] BiasT voltage is set to 13.4V"
[[ $(( $lnbs & 0x7 )) -eq 2 ]] && echo "[ok] BiasT voltage is set to 13.8V"
[[ $(( $lnbs & 0x7 )) -eq 3 ]] && echo "[ok] BiasT voltage is set to 14.2V"
[[ $(( $lnbs & 0x7 )) -eq 4 ]] && echo "[ok] BiasT voltage is set to 18V"
[[ $(( $lnbs & 0x7 )) -eq 5 ]] && echo "[ok] BiasT voltage is set to 18.6V"
[[ $(( $lnbs & 0x7 )) -eq 6 ]] && echo "[ok] BiasT voltage is set to 19.2V"
[[ $(( $lnbs & 0x7 )) -eq 7 ]] && echo "[ok] BiasT voltage is set to 19.8V"
echo

lnbs=$(i2cget -y 0 0x60 0x02)
echo "LNB Status: $lnbs"
echo
[[ $(( $lnbs >> 5 & 0x1 )) -eq 1 ]] && echo "[ok] LNB power is configured on"
[[ $(( $lnbs >> 6 & 0x1 )) -eq 1 ]] && echo "[fail] LNB power chip is overheating!"
[[ $(( $lnbs >> 3 & 0x1 )) -eq 1 ]] && echo "[fail] LNB power chip is in thermal shutdown!"
[[ $(( $lnbs >> 2 & 0x1 )) -eq 1 ]] && echo "[fail] LNB power chip shutdown due to overcurrent: You probably have a short in your RF cable!"
[[ $(( $lnbs >> 1 & 0x1 )) -eq 0 ]] && echo "[fail] No/Very little current flowing on the Bias-T: Is your LNB connected?"
[[ $(( $lnbs >> 1 & 0x1 )) -eq 1 ]] && echo "[ok] LNB detected, normal current flow"
[[ $(( $lnbs & 0x1 )) -eq 1 ]] && echo "[ok] LNB detected, Bias Voltage normal"
[[ $(( $lnbs & 0x1 )) -eq 0 ]] && echo "[fail] Bias Voltage out of range: check your power supply, cable shorts etc"


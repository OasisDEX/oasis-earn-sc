let _oldConsoleLog = console.log

export function showConsoleLogs(enable: boolean) {
  if (enable) {
    console.log = _oldConsoleLog
  } else {
    _oldConsoleLog = console.log
    console.log = function () {
      /* empty on purpose */
    }
  }
}

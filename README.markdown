# sigh-tslint

Sigh plugin for using tslint

## Example

`npm install --save-dev sigh-tslint` then add something like this to your `sigh.js`:
```javascript
var tslint, glob

module.exports = function(pipelines) {
  pipelines['lint'] = [
    glob("src/**/{*.ts,*.tsx}),
    tslint({
      configuration: require("./tslint.json")
    })
  ]
}
```

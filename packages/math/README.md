## @flow-connect/math

[<img alt="npm (scoped)" src="https://img.shields.io/npm/v/@flow-connect/math?style=flat-square" />](https://www.npmjs.com/package/@flow-connect/math)
[<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/saurabh-prosoft/flow-connect-standard-nodes/math?style=flat-square" />](https://github.com/saurabh-prosoft/flow-connect-standard-nodes/actions/workflows/math.yml)
[<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@flow-connect/math?style=flat-square">](https://bundlephobia.com/package/@flow-connect/math)

<br/>

> Custom nodes for common math functions

<br/>

### Custom Nodes

- [Abs](https://flow-connect.saurabhagat.me/reference/standard-nodes/math/abs.html) <br/>
  Outputs absolute value for the input, input can be an array of values, in which case output will also be an array of values.
- [Average](https://flow-connect.saurabhagat.me/reference/standard-nodes/math/average.html) <br/>
  Performs an 'average' function on input array and outputs scalar value.
- [Func](https://flow-connect.saurabhagat.me/reference/standard-nodes/math/func.html) <br/>
  Transforms input value or array of values using the  math function provided as prop to node for e.g. `sin(t) + 0.2cos(2.8t)`, where `t` is the input value or current value from input array.
- [Normalize](https://flow-connect.saurabhagat.me/reference/standard-nodes/math/normalize.html) <br/>
  Normalizes the input value or array based on the mode `relative` or `absolute`, if input is an array, default mode is `relative` in which case normalization parameters (min and max) will be taken as min/max value in array, in `absolute` mode min/max needs to be specified as Node props.
- and much more...!

<br/>

Check out the [docs](https://flow-connect.saurabhagat.me/reference/standard-nodes/math.html) for details on all the custom nodes provided in this package

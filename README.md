# Standard Nodes for [flow-connect](https://github.com/saurabh-prosoft/flow-connect)

A collection of custom nodes extending <img src="" alt="" /> [FlowConnect's](https://flow-connect.saurabhagat.me) [Node](https://flow-connect.saurabhagat.me/reference/api/classes/node.html) architecture.

See individual [packages](./packages/README.md) for more details.

<br/>

Check out the [Docs](https://flow-connect.saurabhagat.me/guide/nodes.html) and [Node API](https://flow-connect.saurabhagat.me/reference/api/classes/node.html) on how to create a custom node yourself!

<br/>

## Development

- Install [lerna](https://github.com/lerna/lerna) for this monorepo

```shell
npm install -g lerna
```

- Build all packages

```shell
npm run build
```

- Build a specific package

```shell
lerna run --scope "@flow-connect/<package-name>" build --stream
```

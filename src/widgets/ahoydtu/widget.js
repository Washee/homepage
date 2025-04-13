import genericProxyHandler from "utils/proxy/handlers/generic";

const widget = {
  api: "{url}/api/{endpoint}",
  proxyHandler: genericProxyHandler,

  mappings: {
    index: {
      endpoint: "index",
    },
    system: {
      endpoint: "system",
    },
  },
};

export default widget;

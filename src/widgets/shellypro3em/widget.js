import genericProxyHandler from "utils/proxy/handlers/generic";

const widget = {
  api: "{url}/rpc/{endpoint}",
  proxyHandler: genericProxyHandler,

  mappings: {
    status: {
      endpoint: "Shelly.GetStatus",
    },
  },
};

export default widget;

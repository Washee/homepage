import genericProxyHandler from "utils/proxy/handlers/generic";

const widget = {
  api: "{url}/{endpoint}",
  proxyHandler: genericProxyHandler,

  mappings: {
    status: {
      endpoint: "cm?cmnd=STATUS+11", //cm?cmnd=Power
    },
  },
};

export default widget;

import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import {useTranslation} from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export const shellypro3emDefaultFields = ["uptime", "eth", "mqtt", "total_W"];

export default function Component({service}) {
  const {t} = useTranslation();

  const {widget} = service;

  // Default fields
  if (!widget.fields?.length > 0) {
    widget.fields = shellypro3emDefaultFields;
  }

  // Fetch relevant data
  const { data: shellypro3emStatusData, error: shellypro3emStatusError } = useWidgetAPI(widget, "status");

  // Check response errors for relevant endpoints
  if (shellypro3emStatusError) {
    return (
      <Container service={service} error={shellypro3emStatusError}/>
    );
  }

  // Check response data for relevant endpoints
  if (!shellypro3emStatusData) {
    return (
      <Container service={service}>
        <Block label="shellypro3em.uptime"/>
        <Block label="shellypro3em.wifi"/>
        <Block label="shellypro3em.eth"/>
        <Block label="shellypro3em.mqtt"/>
        <Block label="shellypro3em.ws"/>
        <Block label="shellypro3em.temperature"/>
        <Block label="shellypro3em.total_W"/>
        <Block label="shellypro3em.phaseA_W"/>
        <Block label="shellypro3em.phaseB_W"/>
        <Block label="shellypro3em.phaseC_W"/>
      </Container>
    );
  }

  // Map data to corresponding fields
  const em = "em:0"
  const valueMap = new Map();
  valueMap.set("uptime", () => {
    return {label: "uptime", mapping: "common.duration", value: shellypro3emStatusData.sys.uptime};
  });
  valueMap.set("eth", () => {
    return {label: "eth", value: shellypro3emStatusData.eth.ip ? shellypro3emStatusData.eth.ip : "Disconnected"};
  });
  valueMap.set("wifi", () => {
    const [first, ...rest] = shellypro3emStatusData.wifi.status;
    const wifiStatus = first.toUpperCase() + rest.join('');
    return {
      label: "wifi", value: wifiStatus !== "Connected" ? wifiStatus : shellypro3emStatusData.wifi.sta_ip
    };
  });
  valueMap.set("mqtt", () => {
    return { label: "mqtt", value: shellypro3emStatusData.mqtt.connected ? "Connected" : "Disconnected" };
  });
  valueMap.set("ws", () => {
    return { label: "ws", value: shellypro3emStatusData.ws.connected ? "Connected" : "Disconnected" };
  });
  valueMap.set("temperature", () => {
    return { label: "temperature", value: shellypro3emStatusData["temperature:0"].tC + "°C" };
  });
  valueMap.set("total_W", () => {
    return {label: "total_W", value: shellypro3emStatusData[em].total_act_power + " W"};
  });
  valueMap.set("phaseA_W", () => {
    return {label: "phaseA_W", value: shellypro3emStatusData[em].a_act_power + " W"};
  });
  valueMap.set("phaseB_W", () => {
    return {label: "phaseB_W", value: shellypro3emStatusData[em].b_act_power + " W"};
  });
  valueMap.set("phaseC_W", () => {
    return {label: "phaseC_W", value: shellypro3emStatusData[em].c_act_power + " W"};
  });

  return (
    <Container service={service}>
      {widget.fields.map((field) => (
        <Block
          label={`shellypro3em.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          key={`shellypro3em.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          value={valueMap.has(field) ? (valueMap.get(field)().mapping ? t(valueMap.get(field)().mapping, {value: valueMap.get(field)().value}) : valueMap.get(field)().value) : "UNKNOWN FIELD"}
        />
      ))
      }
    </Container>
  );
}

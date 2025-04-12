import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import {useTranslation} from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export const ahoydtuDefaultFields = ["inverterW0", "network", "mqtt", "uptime"];

export default function Component({service}) {
  const {t} = useTranslation();

  const {widget} = service;

  // Default fields
  if (!widget.fields?.length > 0) {
    widget.fields = ahoydtuDefaultFields;
  }

  // Map fields to corresponding endpoints
  const endpointMap = new Map();
  endpointMap.set("index", ["inverterW*", "uptime"]);
  endpointMap.set("system", ["network", "nrf", "mqtt", "reboot_reason", "daily_reboot"]);

  var systemFetched, indexFetched = false;
  var ahoydtuIndexData, ahoydtuIndexError;
  var ahoydtuSystemData, ahoydtuSystemError;

  // Fetch relevant data
  if (widget.fields.map(field => field.replaceAll(/\d+/g, '*')).some(r => endpointMap.get("index").includes(r))) {
    var indexOut = useWidgetAPI(widget, "index");
    ahoydtuIndexData = indexOut.data;
    ahoydtuIndexError = indexOut.error;
    indexFetched = true;
  }
  if (widget.fields.some(r => endpointMap.get("system").includes(r))) {
    var systemOut = useWidgetAPI(widget, "system");
    ahoydtuSystemData = systemOut.data;
    ahoydtuSystemError = systemOut.error;
    systemFetched = true;
  }

  // Check response errors for relevant endpoints
  if ((ahoydtuIndexError && indexFetched) || (ahoydtuSystemError && systemFetched)) {
    return (
      <Container service={service} error={ahoydtuIndexError ?? ahoydtuSystemError}/>
    );
  }

  // Check response data for relevant endpoints
  if ((!ahoydtuIndexData && indexFetched) || (!ahoydtuSystemData && systemFetched)) {
    return (
      <Container service={service}>
        <Block label="ahoydtu.network"/>
        <Block label="ahoydtu.nrf"/>
        <Block label="ahoydtu.mqtt"/>
        <Block label="ahoydtu.reboot_reason"/>
        <Block label="ahoydtu.daily_reboot"/>
        <Block label="ahoydtu.uptime"/>
        <Block label="ahoydtu.inverterW0"/>
      </Container>
    );
  }

  // Map data to corresponding fields
  const valueMap = new Map();
  valueMap.set("network", () => {
    return {label: "network", value: ahoydtuSystemData.network.wired ? "ETH" : "WIFI"};
  });
  valueMap.set("nrf", () => {
    return {
      label: "nrf",
      value: ahoydtuSystemData.radioNrf.en ? (ahoydtuSystemData.radioNrf.isconnected ? "Connected" : "Disconnected") : "Disabled"
    };
  });
  valueMap.set("mqtt", () => {
    return {
      label: "mqtt",
      value: ahoydtuSystemData.mqtt.enabled ? (ahoydtuSystemData.mqtt.connected ? "Connected" : "Disconnected") : "Disabled"
    };
  });
  valueMap.set("reboot_reason", () => {
    return {label: "reboot_reason", value: ahoydtuSystemData.chip.reboot_reason};
  });
  valueMap.set("daily_reboot", () => {
    return {label: "daily_reboot", value: ahoydtuSystemData.sched_reboot ? "True" : "False"};
  });
  valueMap.set("uptime", () => {
    return {label: "uptime", mapping: "common.duration", value: ahoydtuIndexData.generic.ts_uptime};
  });
  for (let i = 0; i < 12; i++) {
    valueMap.set("inverterW" + i, () => {
      return {label: "inverterW" + i, value: ahoydtuIndexData.inverter[i]?.cur_pwr + " W"};
    });
  }

  return (
    <Container service={service}>
      {widget.fields.map((field) => (
        <Block
          label={`ahoydtu.${valueMap.get(field)().label}`}
          key={`ahoydtu.${valueMap.get(field)().label}`}
          value={valueMap.get(field)().mapping ? t(valueMap.get(field)().mapping, {value: valueMap.get(field)().value}) : valueMap.get(field)().value}
        />
      ))
      }
    </Container>
  );
}

import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import {useTranslation} from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export const tasmotaDefaultFields = ["uptime", "state"];

export default function Component({service}) {
  const {t} = useTranslation();

  const {widget} = service;

  // Default fields
  if (!widget.fields?.length > 0) {
    widget.fields = tasmotaDefaultFields;
  }

  // Fetch relevant data
  const { data: tasmotaStatusData, error: tasmotaStatusError } = useWidgetAPI(widget, "status");

  // Check response errors for relevant endpoints
  if (tasmotaStatusError) {
    return (
      <Container service={service} error={tasmotaStatusError}/>
    );
  }

  // Check response data for relevant endpoints
  if (!tasmotaStatusData) {
    return (
      <Container service={service}>
        <Block label="tasmota.uptime"/>
        <Block label="tasmota.ssid"/>
        <Block label="tasmota.state"/>
      </Container>
    );
  }

  // Map data to corresponding fields

  const valueMap = new Map();
  valueMap.set("uptime", () => {
    return {label: "uptime", mapping: "common.duration", value: tasmotaStatusData.StatusSTS.UptimeSec};
  });
  valueMap.set("ssid", () => {
    return {label: "ssid", value: tasmotaStatusData.StatusSTS.Wifi?.SSId ? tasmotaStatusData.StatusSTS.Wifi.SSId : null};
  });
  valueMap.set("state", () => {
    return { label: "state", value: tasmotaStatusData.StatusSTS.POWER };
  });

  return (
    <Container service={service}>
      {widget.fields.map((field) => (
        <Block
          label={`tasmota.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          key={`tasmota.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          value={valueMap.has(field) ? (valueMap.get(field)().mapping ? t(valueMap.get(field)().mapping, {value: valueMap.get(field)().value}) : valueMap.get(field)().value) : "UNKNOWN FIELD"}
        />
      ))
      }
    </Container>
  );
}

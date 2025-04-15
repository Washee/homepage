import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import {useTranslation} from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export const shellyplugDefaultFields = ["uptime", "power", "state", "temperature"];


export default function Component({service}) {
  const {t} = useTranslation();

  const {widget} = service;

  // Default fields
  if (!widget.fields?.length > 0) {
    widget.fields = shellyplugDefaultFields;
  }

  // Fetch relevant data
  const { data: shellyplugStatusData, error: shellyplugStatusError } = useWidgetAPI(widget, "status");
  const { data: shellyplugScheduleData, error: shellyplugScheduleError } = useWidgetAPI(widget, "schedule");

  // Check response errors for relevant endpoints
  if (shellyplugStatusError || shellyplugScheduleError) {
    return (
      <Container service={service} error={shellyplugStatusError ?? shellyplugScheduleError}/>
    );
  }

  // Check response data for relevant endpoints
  if (!shellyplugStatusData || !shellyplugScheduleData) {
    return (
      <Container service={service}>
        <Block label="shellyplug.uptime"/>
        <Block label="shellyplug.power"/>
        <Block label="shellyplug.temperature"/>
        <Block label="shellyplug.state"/>
        <Block label="shellyplug.mqtt"/>
        <Block label="shellyplug.ws"/>
        <Block label="shellyplug.scheduleCount"/>
        <Block label="shellyplug.enScheduleCount"/>
        <Block label="shellyplug.disScheduleCount"/>
        <Block label="shellyplug.nextOnEnSchedule"/>
        <Block label="shellyplug.nextOffEnSchedule"/>
      </Container>
    );
  }

  // Map data to corresponding fields
  const scheduleList = shellyplugScheduleData.jobs;
  const valueMap = new Map();
  valueMap.set("uptime", () => {
    return {label: "uptime", mapping: "common.duration", value: shellyplugStatusData.sys.uptime};
  });
  valueMap.set("state", () => {
    return {label: "state", value: shellyplugStatusData["switch:0"].output ? "On" : "Off"};
  });
  valueMap.set("power", () => {
    return {label: "power", value: shellyplugStatusData["switch:0"].apower + " W"};
  });
  valueMap.set("mqtt", () => {
    return { label: "mqtt", value: shellyplugStatusData.mqtt.connected ? "Connected" : "Disconnected" };
  });
  valueMap.set("ws", () => {
    return { label: "ws", value: shellyplugStatusData.ws.connected ? "Connected" : "Disconnected" };
  });
  valueMap.set("temperature", () => {
    return { label: "temperature", value: shellyplugStatusData["switch:0"].temperature.tC + "°C" };
  });
  valueMap.set("scheduleCount", () => {
    return {label: "scheduleCount", value: scheduleList.length};
  });
  valueMap.set("enScheduleCount", () => {
    return {label: "enScheduleCount", value: scheduleList.filter(it => it.enable).length};
  });
  valueMap.set("disScheduleCount", () => {
    return {label: "disScheduleCount", value: scheduleList.filter(it => !it.enable).length};
  });
  valueMap.set("nextOnEnSchedule", () => {
    return {label: "nextOnEnSchedule", mapping: "common.date", value: filterNextSchedule(scheduleList.filter(it => it.enable), true)};
  });
  valueMap.set("nextOffEnSchedule", () => {
    return {label: "nextOffEnSchedule", mapping: "common.date", value: filterNextSchedule(scheduleList.filter(it => it.enable), false)};
  });

  return (
    <Container service={service}>
      {widget.fields.map((field) => (
        <Block
          label={`shellyplug.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          key={`shellyplug.${valueMap.has(field) ? valueMap.get(field)().label : field}`}
          value={valueMap.has(field) ?
            (valueMap.get(field)().mapping ?
              (valueMap.get(field)().mapping === "common.date" ?
                (valueMap.get(field)().value ?
                  t(valueMap.get(field)().mapping, {value: valueMap.get(field)().value, dateStyle: "medium", timeStyle: "short"}) :
                  "-") :
                t(valueMap.get(field)().mapping, {value: valueMap.get(field)().value})) :
              valueMap.get(field)().value) :
            "UNKNOWN FIELD"}
        />
      ))}
    </Container>
  );
}
/**
 *
 * @param scheduleList a list of schedules.
 * @param on boolean which indicates if the switch shall be turned on (true) or off (false) in this schedule.
 * @returns the date of the next schedule.
 */
function filterNextSchedule(scheduleList, on) {
  const filteredList = scheduleList.filter(it => it.calls[0]["params"].on == on)
  let out = null
  if (filteredList.length == 1) {
    out = calculateNextScheduleTimestamp(filteredList[0].timespec);
  } else if (filteredList.length > 1) {
    out = filteredList.reduce((accumulator, currentValue) => {
      const accuTimestamp = calculateNextScheduleTimestamp(accumulator.timespec);
      const currTimestamp = calculateNextScheduleTimestamp(currentValue.timespec);
      return accuTimestamp < currTimestamp ? accuTimestamp : currTimestamp;
    });
  }
  return out;
}

function calculateNextScheduleTimestamp(cron) {
  const currentDate = new Date();

  const cronSplitted = cron.split(" ");
  const second = cronSplitted[0];
  const minute = cronSplitted[1];
  const hour = cronSplitted[2];
  const daysOfWeek = cronSplitted[5].split(",");
  let distance = 7;
  daysOfWeek.forEach((dayOfWeek) => {
    const currDistance = dayOfWeek - currentDate.getDay();
    if(currDistance < distance && currDistance >= 0) {
      if (currDistance == 0) {
        const timeDiff = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, second) - currentDate.getTime();
        if(timeDiff < 0) {
          return;
        }
      }
      distance = currDistance;
    }
  });

  return new Date(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, second).getTime()
    + (distance * 24 * 60 * 60 * 1000));
}

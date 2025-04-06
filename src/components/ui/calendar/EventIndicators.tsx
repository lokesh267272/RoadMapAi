
import React from "react";
import { EventIndicatorsProps } from "./types";
import { renderEventIndicators } from "./utils";

export const EventIndicators: React.FC<EventIndicatorsProps> = ({ 
  date, 
  isMobileView, 
  data 
}) => {
  return <>{renderEventIndicators(date, isMobileView, data)}</>;
};

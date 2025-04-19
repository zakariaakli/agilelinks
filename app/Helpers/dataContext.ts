import { createContext, useState } from "react";
import { EnneagramResult} from "../Models/EnneagramResult";

export const DataContext = createContext<EnneagramResult>(
  { enneagramType1: 0, enneagramType2: 0,
    enneagramType3: 0,enneagramType4:0, enneagramType5:0, enneagramType6:0,
     enneagramType7:0, enneagramType8:0, enneagramType9:0,
   summary: "" });



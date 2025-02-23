import { createContext, useState } from "react";
import { ResultData} from "../Models/EnneagramResult";

export const DataContext = createContext<ResultData>(
  { enneagramType1: 0, enneagramType2: 0,
    enneagramType3: 0,enneagramType4:0, enneagramType5:0, enneagramType6:0,
     enneagramType7:0, enneagramType8:0, enneagramType9:0,  Profession: "",
   UserId: "" });



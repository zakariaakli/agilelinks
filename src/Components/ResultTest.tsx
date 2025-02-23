import React, { useContext } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { DataContext } from "../Helpers/dataContext"
import { ResultData } from "../Models/EnneagramResult";

// Register the necessary components for the Radar chart
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);



const RadarChart: React.FC<{ data: ResultData | null }> = ({ data }) => {

  const RadarOptions = {
    scales: {
      r: {
        ticks: {
          min: 0,
          max: 20,
          stepSize: 5,
          backdropColor: '#343a40', // Updated for newer version
        },
        angleLines: {
          color: '#ebedef',
          lineWidth: 1,
        },
        grid: {
          color: '#ebedef', // Use 'grid' instead of 'gridLines' in the new version
          circular: true,
        },
      },
    },
  };

  const RadarData = {
    labels: ["Perfectionnist", "Helper", "Achiever",
      "Individualist", "Investigator", "Loyalist",
      "Enthusiast", "Challenger", "Peacemaker"],
    datasets: [
      {
        label: "Rate",
        backgroundColor: "#28a745",// "#343a40"
        borderColor: "#005F0F",
        pointBackgroundColor: "#005F0F",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(34, 202, 236, 1)",
        data: [data?.enneagramType1, data?.enneagramType2, data?.enneagramType3,
        data?.enneagramType4, data?.enneagramType5, data?.enneagramType6,
        data?.enneagramType7, data?.enneagramType8, data?.enneagramType9],
      },
    ],
  };

  const DefaultRadarData = {
    labels: ["Perfectionnist", "Helper", "Achiever",
      "Individualist", "Investigator", "Loyalist",
      "Enthusiast", "Challenger", "Peacemaker"],
    datasets: [
      {
        label: "Rate",
        backgroundColor: "#28a745",// "#343a40"
        borderColor: "#005F0F",
        pointBackgroundColor: "#005F0F",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(34, 202, 236, 1)",
        data: [5, 4, 2, 2, 2, 3, 2, 3, 5],
      },
    ],
  };


  return (
    <div>

      {data ?
        <>
          <h2>Specific Enneagram result for you</h2>
          <Radar data={RadarData} options={RadarOptions} />
        </>

        :
        <>
          <h2>Average people assessment shows the following results</h2>
          <Radar data={DefaultRadarData} options={RadarOptions} />
        </>

      }
    </div>
  );
};

export default RadarChart;

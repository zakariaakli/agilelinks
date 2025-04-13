import React, { useContext, useEffect } from "react";
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
import { EnneagramResult } from "../Models/EnneagramResult";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

// Register the necessary components for the Radar chart
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);



const RadarChart: React.FC<{ data: EnneagramResult | null }> = ({ data }) => {

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
        backgroundColor: "#34D399",// "#343a40"
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
        backgroundColor: "#34D399",// "#343a40"
        borderColor: "#005F0F",
        pointBackgroundColor: "#005F0F",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(34, 202, 236, 1)",
        data: [5, 4, 2, 2, 2, 3, 2, 3, 5],
      },
    ],
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      console.log('--------resultData')
      console.log(data)
      if (user && data) {
        try {
          console.log('ResultTest------------ user & resultData')
          // Store the result in the user's document in Firestore
          await setDoc(doc(db, 'users', user.uid), { enneagramResult: data }, { merge: true });
          console.log("result saved successfully in user db");
        } catch (error) {
          console.error("Error saving test result in user db:", error);
        }
      } else if (user) {
        console.log('ResultTest------------ user')
        const userTestResult = localStorage.getItem('userTestResult');
        if (userTestResult) {
          console.log('ResultTest------------ userTestResult')
          try {
            const parsedResult = JSON.parse(userTestResult);
            await setDoc(doc(db, 'users', user.uid), { enneagramResult: parsedResult }, { merge: true });
            localStorage.removeItem('userTestResult');
            console.log("result saved successfully in user db after login");
          } catch (error) {
            console.error("Error saving test result in user db after login:", error);
          }
        }
      } else if(data){
        console.log('ResultTest------------ resultData')
        try {
        // If no user is logged in, store the result in local storage
        localStorage.setItem('userTestResult', JSON.stringify(data));
        console.log("result saved in local storage");
        } catch (error) {
          console.error("Error saving test result in local storage:", error);
        }
      }

      // Clear resultData after saving
    });
  }, [data]);


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

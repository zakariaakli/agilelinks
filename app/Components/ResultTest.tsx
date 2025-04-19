'use client';
import React, { useContext, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { EnneagramResult } from '../Models/EnneagramResult';
import '../Styles/result.module.css';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  data: EnneagramResult | null;
}

const getDominantType = (data: EnneagramResult) => {
  const values = Object.entries(data)
    .filter(([key]) => key.startsWith('enneagramType'))
    .map(([key, val]) => ({ key, value: val as number }));

  const max = values.reduce((a, b) => (a.value > b.value ? a : b));
  return {
    type: max.key.replace('enneagramType', ''),
    value: max.value,
  };
};

const ResultTest: React.FC<Props> = ({ data }) => {
  const RadarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: { min: 0, max: 20, stepSize: 5, backdropColor: '#fff' },
        angleLines: { color: '#ebedef', lineWidth: 1 },
        grid: { color: '#ebedef', circular: true },
      },
    },
  };

  const resultData = data
    ? {
        labels: [
          'Perfectionist',
          'Helper',
          'Achiever',
          'Individualist',
          'Investigator',
          'Loyalist',
          'Enthusiast',
          'Challenger',
          'Peacemaker',
        ],
        datasets: [
          {
            label: 'Your Score',
            backgroundColor: 'rgba(52, 211, 153, 0.3)',
            borderColor: '#34D399',
            pointBackgroundColor: '#34D399',
            pointBorderColor: '#fff',
            data: [
              data.enneagramType1,
              data.enneagramType2,
              data.enneagramType3,
              data.enneagramType4,
              data.enneagramType5,
              data.enneagramType6,
              data.enneagramType7,
              data.enneagramType8,
              data.enneagramType9,
            ],
          },
        ],
      }
    : {
        labels: ['Type 1', '2', '3', '4', '5', '6', '7', '8', '9'],
        datasets: [
          {
            label: 'Average',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderColor: '#999',
            pointBackgroundColor: '#999',
            data: [5, 4, 3, 2, 2, 3, 3, 4, 5],
          },
        ],
      };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user && data) {
        try {
          await setDoc(doc(db, 'users', user.uid), { enneagramResult: data }, { merge: true });
        } catch (error) {
          console.error('Error saving test result:', error);
        }
      } else if (data) {
        try {
          localStorage.setItem('userTestResult', JSON.stringify(data));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
    });
  }, [data]);

  const dominant = data ? getDominantType(data) : null;

  return (
    <div className="result-container">
      {data ? (
        <>
          <h3 className="result-title">Your Enneagram Profile</h3>
          {dominant && (
            <div className="result-dominant">
              Dominant Type: <span className="badge">{dominant.type}</span>
            </div>
          )}
          <div className="chart-wrapper">
            <Radar data={resultData} options={RadarOptions} />
          </div>
          <div className="result-summary">
            <h4>Summary</h4>
            <p>{data.summary}</p>
          </div>
          <button className="Book-appointment-button mt-3">Book a Session with a Coach</button>
        </>
      ) : (
        <>
          <h4>No result available yet</h4>
          <p>Please complete the test to see your result.</p>
        </>
      )}
    </div>
  );
};

export default ResultTest;

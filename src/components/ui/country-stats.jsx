import React from 'react'
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function Country({stats}){
const countryCount = stats.reduce((acc, item) => {
    if (acc[item.country])
      acc[item.country] += 1
    else acc[item.country] = 1
    return acc
},{})
const countries = Object.entries(countryCount).map(([country, count]) => ({
    country, count
}))
  return (
     <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
        width={500}
        height={300}
        data={countries.slice(0, 5)}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="country" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" barSize={20} activeBar={<Rectangle fill="pink" stroke="blue" />} />
      </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

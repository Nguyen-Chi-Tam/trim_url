import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';

export default function Device({stats}) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const deviceCount= stats.reduce((acc, item) => {
    if (acc[item.device])
      acc[item.device] += 1
    else acc[item.device] = 1
    return acc
  }, {})
  const result=Object.keys(deviceCount).map((device)=>({
    device, count:deviceCount[device]
  }))
  return (
    <div style={{width:"100%", height:300}}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={700} height={400}>
        <Pie data={result} labelLine={false}
        label={({device, percent})=>
        `${device}:${(percent*100).toFixed(0)}%`
        }
        dataKey="count"  fill="#8884d8">
          {result.map((entry, index) => (
            <Cell key={`cell-${entry.device}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    </div>
  );
}

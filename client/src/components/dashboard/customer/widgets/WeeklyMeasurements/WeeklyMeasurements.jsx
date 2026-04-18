import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyMeasurements = () => {
    const [currentWeight, setCurrentWeight] = useState(0);
    const [weightDiff, setWeightDiff] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeeklyMeasurements();
    }, []);

    const fetchWeeklyMeasurements = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/stats/weekly-measurements', { withCredentials: true });
            const { current, history } = response.data.data;

            setCurrentWeight(current.weight);
            setWeightDiff(current.weightDiff);

            // Format history for graph
            const formattedHistory = history.map(item => ({
                date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                fullDate: item.date,
                weight: item.weight
            }));
            setHistory(formattedHistory);

        } catch (error) {
            console.error('Error fetching weekly measurements:', error);
            setError('Failed to fetch weekly measurements');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
                <div className="animate-spin rounded-full h-8 w-8" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e0e0e0' }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: '#f0f0f0' }}>Weight Progress</h3>
            </div>

            {/* Main Stats Display */}
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold" style={{ color: '#f0f0f0' }}>{currentWeight}</span>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#555' }}>kg</span>
            </div>

            {/* Graph */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                        <defs>
                            <linearGradient id="weightOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818CF8" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#555' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <Tooltip
                            cursor={false}
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#a5b4fc' }}
                            labelStyle={{ color: '#666', fontSize: '12px', marginBottom: '0.25rem' }}
                            formatter={(v) => [`${v} kg`, 'Weight']}
                        />
                        <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#818CF8"
                            strokeWidth={2.5}
                            fill="url(#weightOverviewGradient)"
                            dot={{ r: 4, fill: '#111', stroke: '#818CF8', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#a5b4fc' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyMeasurements;
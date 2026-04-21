import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const WeeklyMeasurements = () => {
    const [currentWeight, setCurrentWeight]   = useState(0);
    const [weightDiff, setWeightDiff]         = useState(0);
    const [history, setHistory]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [selectedIdx, setSelectedIdx]       = useState(null);
    const weightGoal = parseFloat(localStorage.getItem('weightGoal')) || null;

    useEffect(() => { fetchWeeklyMeasurements(); }, []);

    const fetchWeeklyMeasurements = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/stats/weekly-measurements', { withCredentials: true });
            const { current, history } = response.data.data;
            setCurrentWeight(current.weight);
            setWeightDiff(current.weightDiff);
            setHistory(history.map(item => ({
                date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                weight: item.weight
            })));
        } catch (error) {
            console.error('Error fetching weekly measurements:', error);
            setError('Failed to fetch weekly measurements');
        } finally {
            setLoading(false);
        }
    };

    const renderDot = (props) => {
        const { cx, cy, index, payload } = props;
        const isSelected = index === selectedIdx;
        const label = `${payload.weight}kg`;
        const labelW = label.length * 7 + 16;
        const isLast  = index === history.length - 1;
        const isFirst = index === 0;
        let labelX = cx - labelW / 2;
        if (isLast)  labelX = cx - labelW + 6;
        if (isFirst) labelX = cx - 6;
        return (
            <g key={`dot-${index}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedIdx(isSelected ? null : index)}>
                <circle cx={cx} cy={cy} r={isSelected ? 5 : 3} fill={isSelected ? '#818CF8' : '#111'} stroke="#818CF8" strokeWidth={2} />
                {isSelected && (
                    <>
                        <rect x={labelX} y={cy - 30} width={labelW} height={20} rx={10} fill="#818CF8" />
                        <text x={labelX + labelW / 2} y={cy - 16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>{label}</text>
                    </>
                )}
            </g>
        );
    };

    const diffClass = weightDiff > 0 ? '#f87171' : weightDiff < 0 ? '#4ade80' : '#555';
    const diffText  = weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff < 0 ? weightDiff.toFixed(1) : '0';

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#818CF8', animation: 'spin 0.7s linear infinite' }} />
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
            <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Weight Progress</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#f0f0f0', fontSize: '1.8rem', fontWeight: 700 }}>{currentWeight}</span>
                <span style={{ color: '#555', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>kg</span>
                {weightDiff !== 0 && (
                    <span style={{ color: diffClass, fontSize: '0.8rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 999 }}>{diffText} kg</span>
                )}
            </div>

            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="0" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis
                            domain={[
                                (dataMin) => {
                                    const min = weightGoal ? Math.min(dataMin, weightGoal) : dataMin;
                                    return parseFloat((min - 2).toFixed(1));
                                },
                                (dataMax) => {
                                    const max = weightGoal ? Math.max(dataMax, weightGoal) : dataMax;
                                    return parseFloat((max + 2).toFixed(1));
                                }
                            ]}
                            tickFormatter={v => v % 1 === 0 ? v : v.toFixed(1)}
                            tick={{ fontSize: 10, fill: '#555' }} tickLine={false} axisLine={false} width={36}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#818CF8" strokeWidth={2.5} fill="none" dot={renderDot} activeDot={false} />
                        {weightGoal && (
                            <ReferenceLine
                                y={weightGoal}
                                stroke="#818CF8"
                                strokeDasharray="6 4"
                                strokeWidth={1.5}
                                label={{ content: ({ viewBox }) => (
                                    <text x={viewBox.x + viewBox.width - 4} y={viewBox.y - 5} textAnchor="end" fill="#818CF8" fontSize={10} fontWeight={700}>{weightGoal}kg goal</text>
                                )}}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyMeasurements;

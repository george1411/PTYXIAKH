import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyMeasurements = () => {
    const [currentWeight, setCurrentWeight] = useState(0);
    const [weightDiff, setWeightDiff] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInput, setShowInput] = useState(false);
    const [newWeight, setNewWeight] = useState('');

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

    const handleAddWeight = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/stats/weekly-measurements',
                { weight: newWeight },
                { withCredentials: true }
            );
            setNewWeight('');
            setShowInput(false);
            fetchWeeklyMeasurements(); // Refresh data
        } catch (error) {
            console.error('Error adding measurement:', error);
            // Optionally set an error state here specifically for the form
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem' }}>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Weight Progress</h3>
                <button
                    onClick={() => setShowInput(!showInput)}
                    className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center hover:scale-110 transition-transform"
                    title="Add Today's Weight"
                >
                    <Plus className="h-5 w-5 text-white" />
                </button>
            </div>

            {/* Main Stats Display */}
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-white">{currentWeight}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">kg</span>
                {weightDiff !== 0 && (
                    <span className={`text-sm font-bold ml-2 ${weightDiff < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {weightDiff > 0 ? '+' : ''}{weightDiff} kg
                    </span>
                )}
            </div>

            {/* Input Form Overlay */}
            {showInput && (
                <form onSubmit={handleAddWeight} className="absolute top-14 right-4 bg-neutral-900 border border-neutral-800 shadow-xl rounded-xl p-3 z-50 w-56">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Today's Weight</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                step="0.1"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                                placeholder="0.0"
                                autoFocus
                            />
                            <span className="absolute right-3 top-2 text-gray-500 text-xs font-bold">KG</span>
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg px-4 py-2 text-sm font-bold transition-colors"
                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                        >
                            OK
                        </button>
                    </div>
                </form>
            )}

            {/* Graph */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#171717',
                                border: '1px solid #262626',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9ca3af', fontSize: '12px', marginBottom: '0.25rem' }}
                            cursor={{ stroke: '#262626', strokeWidth: 1 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#555"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#111', stroke: '#555', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#555' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyMeasurements;
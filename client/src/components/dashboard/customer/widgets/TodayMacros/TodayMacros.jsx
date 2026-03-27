import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodayMacros.css';

const TodayMacros = () => {
    const [data, setData] = useState(null);
    const [water, setWater] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/nutrition/balance', { withCredentials: true }),
            axios.get('/api/v1/dailylogs/today', { withCredentials: true }),
        ])
            .then(([balRes, logRes]) => {
                setData(balRes.data.data);
                setWater(logRes.data.data?.waterIntake || 0);
            })
            .catch(err => console.error('TodayMacros error:', err))
            .finally(() => setLoading(false));
    }, []);

    const calPct   = data ? Math.min(100, Math.round((data.consumed / (data.target || 2500)) * 100)) : 0;
    const protPct  = data ? Math.min(100, Math.round((data.proteinConsumed / (data.proteinTarget || 150)) * 100)) : 0;
    const waterPct = Math.min(100, Math.round((water / 8) * 100));

    return (
        <div className="tm-card">
            <h3 className="tm-title">Today's Macros</h3>

            {loading ? (
                <div className="tm-loading"><div className="tm-spinner" /></div>
            ) : !data ? (
                <p className="tm-empty">No data yet — log a meal first</p>
            ) : (
                <div className="tm-rows">
                    {/* Calories */}
                    <div className="tm-row">
                        <div className="tm-row-header">
                            <span className="tm-label">Calories</span>
                            <span className="tm-values">{Math.round(data.consumed)} / {Math.round(data.target)} kcal</span>
                        </div>
                        <div className="tm-bar-track">
                            <div className="tm-bar-fill tm-bar-cal" style={{ width: `${calPct}%` }} />
                        </div>
                    </div>

                    {/* Protein */}
                    <div className="tm-row">
                        <div className="tm-row-header">
                            <span className="tm-label">Protein</span>
                            <span className="tm-values">{Math.round(data.proteinConsumed)} / {data.proteinTarget} g</span>
                        </div>
                        <div className="tm-bar-track">
                            <div className="tm-bar-fill tm-bar-prot" style={{ width: `${protPct}%` }} />
                        </div>
                    </div>

                    {/* Water */}
                    <div className="tm-row">
                        <div className="tm-row-header">
                            <span className="tm-label">Water</span>
                            <span className="tm-values">{water} / 8 glasses</span>
                        </div>
                        <div className="tm-bar-track">
                            <div className="tm-bar-fill tm-bar-water" style={{ width: `${waterPct}%` }} />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TodayMacros;

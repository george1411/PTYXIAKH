import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodayNutrition.css';

const MacroBar = ({ label, value, target, color, unit }) => {
    const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    return (
        <div className="tn-macro">
            <div className="tn-macro-header">
                <span className="tn-macro-label">{label}</span>
                <span className="tn-macro-values">{Math.round(value)} / {Math.round(target)} {unit}</span>
            </div>
            <div className="tn-macro-track">
                <div className="tn-macro-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

const TodayNutrition = () => {
    const [data, setData]       = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [mealsRes, balRes] = await Promise.all([
                    axios.get('/api/v1/meals', { withCredentials: true }),
                    axios.get('/api/v1/nutrition/balance', { withCredentials: true }),
                ]);
                setData(mealsRes.data.data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
                setBalance(balRes.data.data || {});
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch();
    }, []);

    const calTarget     = balance?.target || 2500;
    const proteinTarget = balance?.proteinTarget || 150;
    const carbsTarget   = Math.round(calTarget * 0.45 / 4);
    const fatTarget     = Math.round(calTarget * 0.25 / 9);
    const totals        = data || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return (
        <div className="tn-container">
            <div className="tn-header">
                <h3 className="tn-title">Today's Nutrition</h3>
            </div>

            {loading ? (
                <div className="tn-loading"><div className="tn-spinner" /></div>
            ) : (
                <div className="tn-body">
                    <div className="tn-cal-big">
                        <span className="tn-cal-value">{Math.round(totals.calories)}</span>
                        <span className="tn-cal-target">/ {Math.round(calTarget)} kcal</span>
                    </div>
                    <div className="tn-macros">
                        <MacroBar label="Protein" value={totals.protein} target={proteinTarget} color="#333" unit="g" />
                        <MacroBar label="Carbs"   value={totals.carbs}   target={carbsTarget}   color="#666" unit="g" />
                        <MacroBar label="Fat"     value={totals.fat}     target={fatTarget}     color="#999" unit="g" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodayNutrition;

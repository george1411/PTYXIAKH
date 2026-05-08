import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Footprints, Utensils } from 'lucide-react';
import './MiniWidgets.css';

const STEP_GOAL = 10000;

export const StepsWidget = () => {
    const [steps, setSteps] = useState(null);

    useEffect(() => {
        axios.get('/api/v1/dailylogs/today', { withCredentials: true })
            .then(res => setSteps(res.data.data?.steps ?? 0))
            .catch(() => setSteps(0));
    }, []);

    const pct = steps !== null ? Math.min(100, (steps / STEP_GOAL) * 100) : 0;

    return (
        <div className="mini-widget">
            <span className="mini-widget-title">Steps</span>
            <div className="mini-widget-main">
                <Footprints className="mini-widget-icon" size={20} />
                <span className="mini-widget-value">{steps !== null ? steps.toLocaleString() : '—'}</span>
            </div>
            <span className="mini-widget-goal">Goal: 10,000 steps</span>
            <div className="mini-widget-bar-track">
                <div className="mini-widget-bar-fill" style={{ width: `${pct}%`, background: '#818CF8' }} />
            </div>
        </div>
    );
};

export const CaloriesWidget = () => {
    const [consumed, setConsumed] = useState(null);
    const [target, setTarget] = useState(2500);

    useEffect(() => {
        axios.get('/api/v1/nutrition/balance', { withCredentials: true })
            .then(res => {
                setConsumed(res.data.data?.consumed ?? 0);
                setTarget(res.data.data?.target ?? 2500);
            })
            .catch(() => setConsumed(0));
    }, []);

    const pct = consumed !== null ? Math.min(100, (consumed / target) * 100) : 0;

    return (
        <div className="mini-widget">
            <span className="mini-widget-title">Today Calories</span>
            <div className="mini-widget-main">
                <Utensils className="mini-widget-icon" size={20} />
                <span className="mini-widget-value">{consumed !== null ? consumed.toLocaleString() : '—'}</span>
                <span className="mini-widget-unit">cals</span>
            </div>
            <span className="mini-widget-goal">Goal: {target.toLocaleString()} cals</span>
            <div className="mini-widget-bar-track">
                <div className="mini-widget-bar-fill" style={{ width: `${pct}%`, background: '#f87171' }} />
            </div>
        </div>
    );
};

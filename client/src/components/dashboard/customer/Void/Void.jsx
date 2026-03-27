import React from 'react';
import { WeightPrediction, BMICalculator } from '../../common/widgets/Progress/Progress';
import StreaksStats from '../widgets/StreaksStats/StreaksStats';
import '../../common/widgets/Progress/Progress.css';

const Void = () => {
    return (
        <div className="progress-page">
            <div className="progress-header">
                <h2>Vault</h2>
            </div>
            <div className="progress-grid">
                <WeightPrediction />
                <BMICalculator />
                <StreaksStats />
            </div>
        </div>
    );
};

export default Void;

import React, { useState, useEffect } from 'react';
import DashboardPanel from '../../DashboardPanel';
import { Plus, X, Pencil } from 'lucide-react';
import axios from 'axios';
import './DailyTargets.css';

const ProgressBar = ({ label, value, max, unit, onAdd }) => {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className="progress-bar-container">
            <div className="progress-header">
                <div className="progress-info">
                    <span className="progress-label">{label}</span>
                    <div className="progress-values">
                        <span className="current-value">{value}</span>
                        <span className="max-value">/ {max}{unit}</span>
                    </div>
                </div>
                <button
                    onClick={onAdd}
                    className="add-btn"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="bar-track">
                <div
                    className="bar-fill"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const AddModal = ({ type, onClose, onAdd }) => {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(type, amount);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content add-modal-width">
                <div className="modal-header">
                    <h3 className="modal-title">Add {type}</h3>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="modal-input"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="submit-btn"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    );
};

const EditModal = ({ currentCalories, currentProtein, onClose, onSave }) => {
    const [calories, setCalories] = useState(currentCalories);
    const [protein, setProtein] = useState(currentProtein);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(calories, protein);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content edit-modal-width">
                <div className="modal-header">
                    <h3 className="modal-title">Edit Targets</h3>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="modal-label">Calories (kcal)</label>
                        <input
                            type="number"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                            className="modal-input edit-input"
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="modal-label">Protein (g)</label>
                        <input
                            type="number"
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            className="modal-input edit-input"
                        />
                    </div>
                    <button
                        type="submit"
                        className="submit-btn"
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

const DailyTargets = () => {
    const [data, setData] = useState({
        caloriesBurned: 0,
        proteinConsumed: 0,
        dailyCalorieTarget: 2500,
        dailyProteinTarget: 150
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'calories' or 'protein' or null
    const [showEdit, setShowEdit] = useState(false);

    const fetchData = async () => {
        try {
            const userRes = await axios.get('/api/v1/auth/me', { withCredentials: true });
            const logRes = await axios.get('/api/v1/dailylogs/today', { withCredentials: true });

            setData({
                caloriesBurned: logRes.data.data.caloriesBurned,
                proteinConsumed: logRes.data.data.proteinConsumed,
                dailyCalorieTarget: userRes.data.data.user.dailyCalorieTarget || 2500,
                dailyProteinTarget: userRes.data.data.user.dailyProteinTarget || 150,
            });
            setLoading(false);
        } catch (error) {
            console.error("Error loading daily targets:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (type, amount) => {
        try {
            await axios.post('/api/v1/dailylogs/add', {
                type: type,
                amount: amount
            }, { withCredentials: true });

            setShowModal(null);
            fetchData();
        } catch (error) {
            console.error("Error adding log:", error);
        }
    };

    const handleEdit = async (calories, protein) => {
        try {
            const res = await axios.post('/api/v1/dailygoals/update', {
                calories: parseInt(calories),
                protein: parseInt(protein)
            }, { withCredentials: true });

            if (res.data.success) {
                // Optimistically update local state or use response data
                // Using functional update to ensure we have latest state if needed, though here we just need to update targets
                setData(prev => ({
                    ...prev,
                    dailyCalorieTarget: parseInt(calories),
                    dailyProteinTarget: parseInt(protein)
                }));
                setShowEdit(false);
                fetchData(); // Fetch to ensure consistency
            }
        } catch (error) {
            console.error("Error updating goals:", error);
        }
    };

    if (loading) return <DashboardPanel className="col-span-1 h-full"><div className="p-4 text-gray-500">Loading...</div></DashboardPanel>;

    return (
        <DashboardPanel title="Daily Targets" className="col-span-1 h-full relative">
            <div className="edit-button-wrapper">
                <button
                    onClick={() => setShowEdit(true)}
                    className="edit-btn"
                >
                    <Pencil size={16} />
                </button>
            </div>

            {showModal && (
                <AddModal
                    type={showModal}
                    onClose={() => setShowModal(null)}
                    onAdd={handleAdd}
                />
            )}

            {showEdit && (
                <EditModal
                    currentCalories={data.dailyCalorieTarget}
                    currentProtein={data.dailyProteinTarget}
                    onClose={() => setShowEdit(false)}
                    onSave={handleEdit}
                />
            )}

            <div className="daily-targets-content">
                <ProgressBar
                    label="Calories"
                    value={data.caloriesBurned}
                    max={data.dailyCalorieTarget}
                    unit="kcal"
                    onAdd={() => setShowModal('calories')}
                />

                <ProgressBar
                    label="Protein"
                    value={data.proteinConsumed}
                    max={data.dailyProteinTarget}
                    unit="g"
                    onAdd={() => setShowModal('protein')}
                />
            </div>
        </DashboardPanel>
    );
};

export default DailyTargets;

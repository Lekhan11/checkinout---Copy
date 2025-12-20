import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

function CheckInOut({ userId }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current time in HH:MM:SS format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Fetch today's attendance record
  const fetchTodayRecord = async () => {
    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

      setTodayRecord(data);
    } catch (err) {
      console.error('Error fetching today record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [userId]);

  // Handle check-in
  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const today = getTodayDate();
      const currentTime = getCurrentTime();

      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: userId,
            date: today,
            check_in: currentTime
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTodayRecord(data);
      setMessage('Check-in successful!');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const currentTime = getCurrentTime();

      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out: currentTime })
        .eq('id', todayRecord.id)
        .select()
        .single();

      if (error) throw error;

      setTodayRecord(data);
      setMessage('Check-out successful!');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const hasCheckedIn = todayRecord && todayRecord.check_in;
  const hasCheckedOut = todayRecord && todayRecord.check_out;

  return (
    <div className="checkinout-container">
      <h3>Today's Attendance</h3>
      
      <div className="status-info">
        <p><strong>Date:</strong> {getTodayDate()}</p>
        {hasCheckedIn && (
          <p><strong>Check-in Time:</strong> {todayRecord.check_in}</p>
        )}
        {hasCheckedOut && (
          <p><strong>Check-out Time:</strong> {todayRecord.check_out}</p>
        )}
      </div>

      <div className="action-buttons">
        <button
          onClick={handleCheckIn}
          disabled={hasCheckedIn || actionLoading}
          className="btn-primary"
        >
          {actionLoading ? 'Processing...' : 'Check In'}
        </button>

        <button
          onClick={handleCheckOut}
          disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
          className="btn-secondary"
        >
          {actionLoading ? 'Processing...' : 'Check Out'}
        </button>
      </div>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CheckInOut;

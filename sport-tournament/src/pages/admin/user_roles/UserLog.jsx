import { useEffect, useState } from "react";
import axios from "axios";

export default function UserLog({ userId }) {
  const [logs, setLogs] = useState([]);

  useEffect(()=> {
    (async()=>{
      const res = await axios.get(`http://localhost:5000/api/users/logs/${userId}`);
      setLogs(res.data || []);
    })();
  },[userId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
      <div className="space-y-3">
        {logs.length===0 ? <p className="text-gray-500">No logs</p> :
          logs.map(l => (
            <div key={l.id} className="p-3 border rounded">
              <div className="text-xs text-gray-500">{new Date(l.timestamp).toLocaleString()}</div>
              <div className="font-medium">{l.action}</div>
              <div className="text-sm text-gray-600">{JSON.stringify(l.meta)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

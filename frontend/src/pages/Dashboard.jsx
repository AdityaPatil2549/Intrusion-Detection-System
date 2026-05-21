import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Activity, UploadCloud, Terminal, Download, Info, X, Target, Zap, FileText, LogOut, Database, History } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  normal: '#00ff3f', // neon green
  dos: '#ff003c',    // neon red
  probe: '#00f3ff',  // cyan
  r2l: '#f3ff00',    // yellow
  u2r: '#ff00ff'     // magenta
};

const ATTACK_INFO = {
  normal: { title: "Normal Traffic", desc: "Standard, benign network traffic. No malicious signatures detected.", color: "text-neon-green", border: "border-neon-green" },
  dos: { title: "Denial of Service (DoS)", desc: "An attack meant to shut down a machine or network, making it inaccessible to its intended users by flooding it with traffic.", color: "text-neon-red", border: "border-neon-red" },
  probe: { title: "Probing Attack", desc: "Surveillance and probing, such as port scanning, to gather information about a network's vulnerabilities.", color: "text-neon-cyan", border: "border-neon-cyan" },
  r2l: { title: "Remote to Local (R2L)", desc: "Unauthorized access from a remote machine, trying to exploit local access privileges to gain user-level access.", color: "text-[#f3ff00]", border: "border-[#f3ff00]" },
  u2r: { title: "User to Root (U2R)", desc: "Unauthorized access to local superuser (root) privileges by a local unprivileged user exploiting a vulnerability.", color: "text-neon-magenta", border: "border-neon-magenta" }
};

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [visibleLogs, setVisibleLogs] = useState([]);
  const logsContainerRef = useRef(null);
  
  // Supabase History State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setHistory(data);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  useEffect(() => {
    if (results && results.logs) {
      setVisibleLogs([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < results.logs.length) {
          setVisibleLogs(prev => {
             if (prev.length >= results.logs.length) return prev;
             return [...prev, results.logs[prev.length]];
          });
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50); 
      return () => clearInterval(interval);
    }
  }, [results]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        handleUpload(droppedFile);
      } else {
        toast.error("Please upload a valid .csv file.");
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      handleUpload(selectedFile);
      e.target.value = null;
    }
  };

  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    setLoading(true);
    setResults(null); 
    setVisibleLogs([]);
    setShowHistory(false);
    
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post('http://localhost:5000/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      setResults(data);
      toast.success("Analysis Complete!", {
         style: { background: '#171717', color: '#00ff3f', border: '1px solid #00ff3f' }
      });

      // Save to Supabase SQL
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('analysis_history').insert([{
          user_id: user.id,
          total_records: data.total_records,
          threat_level: data.threat_level,
          filename: fileToUpload.name,
          normal_count: data.stats.normal || 0,
          dos_count: data.stats.dos || 0,
          probe_count: data.stats.probe || 0,
          r2l_count: data.stats.r2l || 0,
          u2r_count: data.stats.u2r || 0,
        }]);
        if (!error) {
           fetchHistory(); // update the sidebar
        } else {
           console.error("Supabase Save Error:", error);
        }
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      const errMsg = error.response?.data?.error || "Failed to analyze data. Please check backend.";
      toast.error(errMsg, { 
         duration: 6000,
         style: { background: '#171717', color: '#ff003c', border: '1px solid #ff003c' }
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(0, 243, 255); 
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SENTINEL AI", 14, 20);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Intrusion Detection System - Threat Report", 14, 30);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 50);
    doc.text(`Total Records Analyzed: ${results.total_records.toLocaleString()}`, 14, 58);
    
    const threatLevel = results.threat_level;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(threatLevel > 20 ? 255 : 0, threatLevel > 20 ? 0 : 200, 0);
    doc.text(`Overall Threat Level: ${threatLevel}%`, 14, 66);
    
    const tableData = Object.entries(results.stats).map(([key, value]) => [
      key.toUpperCase(), 
      value.toLocaleString(), 
      ((value / results.total_records) * 100).toFixed(1) + '%'
    ]);
    
    doc.autoTable({
      startY: 75,
      head: [['Threat Type', 'Packets Detected', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [0, 243, 255] },
      styles: { font: "helvetica" }
    });
    
    const finalY = doc.lastAutoTable.finalY || 75;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Report generated automatically by Sentinel AI Machine Learning Engine.", 14, finalY + 20);

    doc.save("SentinelAI_Security_Report.pdf");
  };

  const pieData = results 
    ? Object.entries(results.stats)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value })) 
    : [];

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-dark-900">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-dark-800 border-r border-dark-700 p-6 flex-col z-20 shadow-xl shadow-black/50">
        <div className="flex items-center gap-3 mb-10">
          <Shield className="w-8 h-8 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
          <h1 className="text-xl font-bold text-white tracking-wider">SENTINEL<span className="text-neon-cyan">.AI</span></h1>
        </div>
        
        <nav className="flex-1 space-y-4">
          <button 
             onClick={() => setShowHistory(false)}
             className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border ${!showHistory ? 'text-neon-cyan bg-dark-700/50 border-neon-cyan/20 shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            <Activity className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button 
             onClick={() => setShowHistory(true)}
             className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border ${showHistory ? 'text-neon-cyan bg-dark-700/50 border-neon-cyan/20 shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span>Analysis History</span>
          </button>
        </nav>

        <div className="mt-auto space-y-4">
           <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700 shadow-inner">
             <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold text-sm uppercase tracking-wider">
                <Database className="w-4 h-4 text-neon-yellow" /> Data Source
             </div>
             <div className="text-xs text-gray-400 flex justify-between">
                <span>Status</span>
                <span className="text-neon-green">Connected</span>
             </div>
             <div className="text-xs text-gray-400 flex justify-between mt-1">
                <span>Storage</span>
                <span className="text-white">Supabase SQL</span>
             </div>
           </div>

           <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-neon-red hover:bg-neon-red/10 border border-transparent hover:border-neon-red/30 p-3 rounded-lg transition-colors"
           >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-dark-800/80 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-dark-700/50 gap-4 md:gap-0">
            <div>
              <div className="flex items-center gap-2 md:hidden mb-2">
                 <Shield className="w-6 h-6 text-neon-cyan" />
                 <h1 className="text-lg font-bold text-white tracking-wider">SENTINEL<span className="text-neon-cyan">.AI</span></h1>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                 {showHistory ? 'Analysis History' : 'Intrusion Detection System'}
              </h2>
              <p className="text-gray-400 mt-1 text-sm md:text-base">
                 {showHistory ? 'View past machine learning traffic analyses from your SQL database' : 'Upload network traffic CSV for ML-based threat analysis'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
               <div className="flex gap-2 items-center w-full md:w-auto justify-end">
                 {results && !showHistory && (
                   <button 
                     onClick={generatePDF}
                     className="bg-dark-700 text-white border border-dark-600 px-4 py-2.5 rounded-xl font-medium hover:bg-dark-600 transition-all flex items-center gap-2 group text-sm md:text-base"
                   >
                     <Download className="w-5 h-5 group-hover:text-neon-cyan transition-colors" /> Export PDF
                   </button>
                 )}
               </div>
            </div>
          </header>

          {/* HISTORY VIEW */}
          {showHistory && (
             <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700">
                {history.length === 0 ? (
                   <div className="text-center py-12 text-gray-500">No previous analyses found in database.</div>
                ) : (
                   <div className="space-y-4">
                      {history.map((record) => (
                         <div key={record.id} className="flex justify-between items-center bg-dark-900/50 p-4 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                            <div>
                               <div className="text-white font-medium">{record.filename}</div>
                               <div className="text-sm text-gray-500">{new Date(record.created_at).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right hidden md:block">
                                  <div className="text-xs text-gray-500 uppercase">Records</div>
                                  <div className="text-white font-mono">{record.total_records.toLocaleString()}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs text-gray-500 uppercase">Threat Level</div>
                                  <div className={`font-bold text-lg ${record.threat_level > 20 ? 'text-neon-red drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]' : 'text-neon-green'}`}>
                                     {Number(record.threat_level).toFixed(2)}%
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}

          {/* MAIN UPLOAD VIEW */}
          {!showHistory && !results && (
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`h-96 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl backdrop-blur-sm transition-all duration-300 relative ${isDragging ? 'border-neon-cyan bg-neon-cyan/5 scale-[1.02]' : 'border-dark-700 bg-dark-800/30'}`}
            >
              {loading && (
                 <div className="absolute inset-0 bg-dark-900/80 backdrop-blur flex flex-col items-center justify-center z-10 rounded-xl">
                    <div className="w-16 h-16 border-4 border-dark-700 border-t-neon-cyan rounded-full animate-spin"></div>
                    <h3 className="mt-6 text-xl text-neon-cyan font-bold tracking-widest animate-pulse">ANALYZING PACKETS...</h3>
                 </div>
              )}
              <div className="relative pointer-events-none">
                <FileText className={`w-20 h-20 mb-4 transition-colors ${isDragging ? 'text-neon-cyan' : 'text-dark-700'}`} />
                <div className={`absolute inset-0 animate-ping opacity-20 ${isDragging ? 'text-neon-cyan' : 'hidden'}`}>
                  <FileText className="w-20 h-20" />
                </div>
              </div>
              <h3 className="text-2xl text-gray-300 font-medium tracking-wide text-center px-4">
                 {isDragging ? 'Drop CSV File Here' : 'Drag & Drop Network Traffic Data'}
              </h3>
              <p className="text-gray-500 mt-2 text-center">or click below to browse</p>
              
              <div className="mt-8 relative z-20">
                 <input 
                   type="file" 
                   id="fileInput"
                   accept=".csv"
                   onChange={handleFileChange}
                   className="hidden"
                 />
                 <label 
                   htmlFor="fileInput"
                   className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 px-6 py-3 rounded-lg font-medium hover:bg-neon-cyan/20 transition-all cursor-pointer flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                 >
                   <UploadCloud className="w-5 h-5" /> Select CSV File
                 </label>
              </div>
            </div>
          )}

          {/* MAIN RESULTS VIEW */}
          {!showHistory && results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="flex justify-end">
                <button 
                   onClick={() => setResults(null)}
                   className="text-gray-400 hover:text-white text-sm flex items-center gap-2 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-700 transition-colors"
                >
                   <X className="w-4 h-4" /> Analyze Another Dataset
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700 relative overflow-hidden group hover:border-dark-600 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Records Analyzed</div>
                  <div className="text-4xl font-bold text-white mt-2">{results.total_records.toLocaleString()}</div>
                </div>
                
                <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700 relative overflow-hidden group hover:border-dark-600 transition-colors">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${results.threat_level > 20 ? 'neon-red' : 'neon-green'}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Threat Level</div>
                  <div className="text-4xl font-bold mt-2 flex items-end gap-2">
                    <span className={results.threat_level > 20 ? 'text-neon-red drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]' : 'text-neon-green drop-shadow-[0_0_8px_rgba(0,255,63,0.8)]'}>
                      {results.threat_level}%
                    </span>
                  </div>
                </div>

                <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700 relative overflow-hidden">
                   <div className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Threat Explanations</div>
                   <div className="flex flex-wrap gap-2">
                      {Object.keys(ATTACK_INFO).map((type) => (
                         <button 
                            key={type}
                            onClick={() => setModalData(ATTACK_INFO[type])}
                            className="bg-dark-900/80 border border-dark-600 px-3 py-1 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:border-neon-cyan transition-colors uppercase flex items-center gap-1"
                         >
                            <Info className="w-3 h-3" /> {type}
                         </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700 flex flex-col hover:border-dark-600 transition-colors">
                  <h3 className="text-lg font-medium text-white mb-4 uppercase tracking-widest text-sm text-gray-400">Attack Distribution</h3>
                  <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.normal} 
                                  style={{ filter: `drop-shadow(0px 0px 6px ${COLORS[entry.name] || COLORS.normal}40)` }}/>
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="text-center bg-dark-900/80 rounded-full w-24 h-24 flex flex-col items-center justify-center border border-dark-700/50 shadow-inner">
                          <div className="text-2xl font-bold text-white">{pieData.length}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Classes</div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800/80 backdrop-blur-md p-6 rounded-2xl border border-dark-700 flex flex-col hover:border-dark-600 transition-colors">
                  <h3 className="text-lg font-medium text-white mb-4 uppercase tracking-widest text-sm text-gray-400">Threat Breakdown</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pieData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Tooltip 
                           cursor={{fill: '#262626'}}
                           contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.normal} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-[#050505] rounded-2xl border border-dark-700 overflow-hidden font-mono shadow-2xl">
                <div className="bg-dark-800/80 px-5 py-3 border-b border-dark-700 flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-neon-cyan" />
                  <span className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Live Stream Logs</span>
                </div>
                <div 
                   ref={logsContainerRef}
                   className="p-5 h-72 overflow-y-auto space-y-1 text-xs md:text-sm scroll-smooth custom-scrollbar"
                >
                  {visibleLogs.map((log, i) => {
                    const isNormal = log.prediction === 'normal';
                    const time = new Date(Date.now() - (results.logs.length - i) * 1234);
                    const timeStr = time.toISOString().split('T')[1].slice(0, 12);
                    
                    return (
                      <div key={i} className="flex gap-2 md:gap-4 hover:bg-dark-800/80 px-2 md:px-3 py-1.5 rounded transition-colors group animate-in slide-in-from-left-4 duration-300">
                        <span className="text-gray-600 hidden md:inline">[{timeStr}]</span>
                        <span className={isNormal ? 'text-neon-cyan/70' : 'text-neon-red font-bold'}>
                          {isNormal ? '[INFO]' : '[CRIT]'}
                        </span>
                        <span className="text-gray-400 group-hover:text-gray-300 transition-colors hidden md:inline">Analyzing traffic vector...</span>
                        
                        <span className="ml-auto flex items-center gap-2">
                          <span className="text-gray-500 hidden md:inline">Predicted:</span>
                          <span className={`${isNormal ? 'text-neon-green' : 'text-neon-red drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]'} font-bold uppercase tracking-wider w-12 md:w-16 text-right`}>
                            {log.prediction}
                          </span>
                        </span>
                        <span className="text-gray-500 w-12 md:w-16 text-right font-semibold">
                          {(log.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={`bg-dark-800 border ${modalData.border} rounded-2xl p-6 max-w-md w-full shadow-2xl relative`}>
              <button onClick={() => setModalData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                 <Target className={`w-8 h-8 ${modalData.color}`} />
                 <h3 className={`text-xl md:text-2xl font-bold ${modalData.color}`}>{modalData.title}</h3>
              </div>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">{modalData.desc}</p>
              
              <div className="mt-8 pt-4 border-t border-dark-700 flex justify-end">
                 <button onClick={() => setModalData(null)} className="bg-dark-700 text-white px-4 py-2 rounded-lg hover:bg-dark-600 transition-colors">
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

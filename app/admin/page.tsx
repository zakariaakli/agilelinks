'use client';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import styles from '../../Styles/admin.module.css';

interface TokenUsage {
  id: string;
  userId: string;
  userEmail: string;
  functionName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: any;
  requestData?: any;
  responseData?: any;
}

interface UserStats {
  email: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
}

interface FirebaseStats {
  totalCost: number;
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  operationBreakdown: { [collection: string]: { reads: number; writes: number; deletes: number; cost: number } };
  userBreakdown: { [userEmail: string]: { operations: number; cost: number } };
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [firebaseStats, setFirebaseStats] = useState<FirebaseStats>({
    totalCost: 0,
    totalReads: 0,
    totalWrites: 0,
    totalDeletes: 0,
    operationBreakdown: {},
    userBreakdown: {}
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [apiResults, setApiResults] = useState<{ [key: string]: any }>({});

  const ADMIN_EMAIL = 'zakaria.akli.ensa@gmail.com';

  // OpenAI pricing (as of 2024 - update these as needed)
  const PRICING = {
    'gpt-4': {
      prompt: 0.03 / 1000,    // $0.03 per 1K prompt tokens
      completion: 0.06 / 1000  // $0.06 per 1K completion tokens
    },
    'gpt-3.5-turbo': {
      prompt: 0.0015 / 1000,   // $0.0015 per 1K prompt tokens
      completion: 0.002 / 1000  // $0.002 per 1K completion tokens
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.email === ADMIN_EMAIL);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTokenUsageData();
      loadFirebaseUsageData();
    }
  }, [isAdmin, selectedFunction, dateRange]);

  const loadTokenUsageData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading token usage data...');
      
      // For now, let's load all data without date filtering since we're using string timestamps
      let tokenQuery = query(
        collection(db, 'tokenUsage'),
        orderBy('timestamp', 'desc')
      );

      if (selectedFunction !== 'all') {
        tokenQuery = query(
          collection(db, 'tokenUsage'),
          where('functionName', '==', selectedFunction),
          orderBy('timestamp', 'desc')
        );
      }

      console.log('🔍 Executing Firestore query...');
      const querySnapshot = await getDocs(tokenQuery);
      const usages: TokenUsage[] = [];
      
      console.log('📄 Query returned', querySnapshot.size, 'documents');
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📝 Document data:', data);
        
        usages.push({
          id: doc.id,
          userId: data.userId || 'unknown',
          userEmail: data.userEmail || 'unknown',
          functionName: data.functionName || 'unknown',
          promptTokens: data.promptTokens || 0,
          completionTokens: data.completionTokens || 0,
          totalTokens: data.totalTokens || 0,
          cost: data.cost || 0,
          timestamp: data.timestamp,
          requestData: data.requestData,
          responseData: data.responseData
        } as TokenUsage);
      });

      setTokenUsages(usages);

      // Calculate totals
      const totalCostCalc = usages.reduce((sum, usage) => sum + (usage.cost || 0), 0);
      const totalTokensCalc = usages.reduce((sum, usage) => sum + usage.totalTokens, 0);
      
      setTotalCost(totalCostCalc);
      setTotalTokens(totalTokensCalc);

      // Calculate user statistics
      const userStatsMap = new Map<string, UserStats>();
      
      usages.forEach(usage => {
        const email = usage.userEmail;
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            totalCost: 0,
            totalTokens: 0,
            requestCount: 0
          });
        }
        
        const stats = userStatsMap.get(email)!;
        stats.totalCost += usage.cost || 0;
        stats.totalTokens += usage.totalTokens;
        stats.requestCount += 1;
      });

      const userStatsArray = Array.from(userStatsMap.values())
        .sort((a, b) => b.totalCost - a.totalCost);
      
      setUserStats(userStatsArray);

      console.log('✅ Successfully loaded', usages.length, 'token usage records');
      console.log('💰 Total cost:', totalCostCalc);
      console.log('🎯 Total tokens:', totalTokensCalc);

    } catch (error) {
      console.error('❌ Error loading token usage data:', error);
      
      // Set empty data on error so we can see the UI
      setTokenUsages([]);
      setUserStats([]);
      setTotalCost(0);
      setTotalTokens(0);
    } finally {
      setLoading(false);
    }
  };

  const loadFirebaseUsageData = async () => {
    try {
      console.log('🔥 Loading Firebase usage data...');
      
      // Query firebaseUsage collection
      const firebaseQuery = query(
        collection(db, 'firebaseUsage'),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(firebaseQuery);
      console.log('📄 Firebase usage query returned', querySnapshot.size, 'documents');
      
      let totalCost = 0;
      let totalReads = 0;
      let totalWrites = 0;
      let totalDeletes = 0;
      const operationBreakdown: { [collection: string]: { reads: number; writes: number; deletes: number; cost: number } } = {};
      const userBreakdown: { [userEmail: string]: { operations: number; cost: number } } = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        totalCost += data.cost || 0;
        
        // Count operations
        switch (data.operation) {
          case 'read':
            totalReads += data.documentCount || 0;
            break;
          case 'write':
            totalWrites += data.documentCount || 0;
            break;
          case 'delete':
            totalDeletes += data.documentCount || 0;
            break;
        }
        
        // Collection breakdown
        const collectionName = data.collection;
        if (!operationBreakdown[collectionName]) {
          operationBreakdown[collectionName] = { reads: 0, writes: 0, deletes: 0, cost: 0 };
        }
        if (data.operation === 'reads') {
          operationBreakdown[collectionName].reads += data.documentCount || 0;
        } else if (data.operation === 'writes') {
          operationBreakdown[collectionName].writes += data.documentCount || 0;
        } else if (data.operation === 'deletes') {
          operationBreakdown[collectionName].deletes += data.documentCount || 0;
        }
        operationBreakdown[collectionName].cost += data.cost || 0;
        
        // User breakdown
        const userEmail = data.userEmail;
        if (!userBreakdown[userEmail]) {
          userBreakdown[userEmail] = { operations: 0, cost: 0 };
        }
        userBreakdown[userEmail].operations += data.documentCount || 0;
        userBreakdown[userEmail].cost += data.cost || 0;
      });
      
      setFirebaseStats({
        totalCost,
        totalReads,
        totalWrites,
        totalDeletes,
        operationBreakdown,
        userBreakdown
      });

      console.log('✅ Successfully loaded Firebase usage:', { totalCost, totalReads, totalWrites, totalDeletes });
      
    } catch (error) {
      console.error('❌ Error loading Firebase usage data:', error);
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  const formatDate = (timestamp: any) => {
    try {
      // Handle both Firestore Timestamp and string timestamps
      if (timestamp?.toDate) {
        return timestamp.toDate().toLocaleString();
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
      } else {
        return new Date(timestamp).toLocaleString();
      }
    } catch {
      return 'Invalid Date';
    }
  };

  const getFunctionDisplayName = (functionName: string) => {
    const displayNames: { [key: string]: string } = {
      'openai_questions': 'Question Generation',
      'openai_milestones': 'Milestone Generation',
      'openai_nudges': 'Weekly Milestone Nudges',
      'openai_daily_nudges': 'Daily Nudge Generation',
      'openai_feedback': 'Feedback Processing',
      'enneagram_chat_conversation': 'Enneagram Test Chat',
      'enneagram_result_parsing': 'Enneagram Result Processing',
      'test_function': 'Test Function'
    };
    return displayNames[functionName] || functionName;
  };

  const apiEndpoints = [
    { name: 'Milestone Reminders (with Email)', endpoint: '/api/milestoneReminders', method: 'POST' },
    { name: 'Track OpenAI Usage', endpoint: '/api/track-openai-usage', method: 'GET' }
  ];

  const callApi = async (endpoint: string, method: string, name: string) => {
    try {
      setApiResults(prev => ({ ...prev, [name]: { loading: true } }));
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      setApiResults(prev => ({
        ...prev,
        [name]: {
          loading: false,
          success: response.ok,
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      setApiResults(prev => ({
        ...prev,
        [name]: {
          loading: false,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading admin dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h1>Access Denied</h1>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h1>Access Denied</h1>
          <p>You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const uniqueFunctions = Array.from(
    new Set(tokenUsages.map(usage => usage.functionName))
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔧 Admin Dashboard</h1>
        <p className={styles.subtitle}>OpenAI Token Usage & Cost Monitoring</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'api-testing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('api-testing')}
        >
          🚀 API Testing
        </button>
      </div>

      {activeTab === 'api-testing' ? (
        /* API Testing Tab */
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 API Testing Panel</h2>
          <p className={styles.subtitle}>Test all available API endpoints with one click</p>
          
          <div className={styles.apiGrid}>
            {apiEndpoints.map((api) => (
              <div key={api.name} className={styles.apiCard}>
                <div className={styles.apiCardHeader}>
                  <h3>{api.name}</h3>
                  <span className={styles.method}>{api.method}</span>
                </div>
                <div className={styles.apiCardBody}>
                  <p className={styles.endpoint}>{api.endpoint}</p>
                  <button
                    className={styles.apiButton}
                    onClick={() => callApi(api.endpoint, api.method, api.name)}
                    disabled={apiResults[api.name]?.loading}
                  >
                    {apiResults[api.name]?.loading ? '⏳ Testing...' : '🚀 Test API'}
                  </button>
                  
                  {apiResults[api.name] && !apiResults[api.name].loading && (
                    <div className={`${styles.apiResult} ${apiResults[api.name].success ? styles.success : styles.error}`}>
                      <div className={styles.resultHeader}>
                        <span className={styles.status}>
                          {apiResults[api.name].success ? '✅ Success' : '❌ Error'} 
                          ({apiResults[api.name].status || 'N/A'})
                        </span>
                        <span className={styles.timestamp}>{apiResults[api.name].timestamp}</span>
                      </div>
                      <pre className={styles.resultData}>
                        {JSON.stringify(
                          apiResults[api.name].data || apiResults[api.name].error, 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Dashboard Tab */
        <>
          {/* Filters */}
          <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="function-select">Function:</label>
          <select
            id="function-select"
            value={selectedFunction}
            onChange={(e) => setSelectedFunction(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Functions</option>
            {uniqueFunctions.map(func => (
              <option key={func} value={func}>
                {getFunctionDisplayName(func)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date-range">Date Range:</label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={styles.select}
          >
            <option value="1day">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Debug Info */}
      <div className={styles.section}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
            🔍 Debug Information
          </summary>
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <p><strong>User:</strong> {user?.email}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Token Usages Count:</strong> {tokenUsages.length}</p>
            <p><strong>User Stats Count:</strong> {userStats.length}</p>
            <p><strong>Selected Function:</strong> {selectedFunction}</p>
            <p><strong>Date Range:</strong> {dateRange}</p>
            <p><strong>Total Cost:</strong> {totalCost}</p>
            <p><strong>Total Tokens:</strong> {totalTokens}</p>
            {tokenUsages.length > 0 && (
              <div>
                <p><strong>Sample Record:</strong></p>
                <pre style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto' }}>
                  {JSON.stringify(tokenUsages[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* OpenAI Summary Cards */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>OpenAI Usage Summary</h2>
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>OpenAI Cost</h3>
              <span className={styles.icon}>🤖</span>
            </div>
            <div className={styles.cardValue}>{formatCost(totalCost)}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Total Tokens</h3>
              <span className={styles.icon}>🎯</span>
            </div>
            <div className={styles.cardValue}>{formatTokens(totalTokens)}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>API Calls</h3>
              <span className={styles.icon}>📊</span>
            </div>
            <div className={styles.cardValue}>{tokenUsages.length}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Active Users</h3>
              <span className={styles.icon}>👥</span>
            </div>
            <div className={styles.cardValue}>{userStats.length}</div>
          </div>
        </div>
      </div>

      {/* Firebase Summary Cards */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Firebase Usage Summary</h2>
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Firebase Cost</h3>
              <span className={styles.icon}>🔥</span>
            </div>
            <div className={styles.cardValue}>{formatCost(firebaseStats.totalCost)}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Reads</h3>
              <span className={styles.icon}>👀</span>
            </div>
            <div className={styles.cardValue}>{firebaseStats.totalReads.toLocaleString()}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Writes</h3>
              <span className={styles.icon}>✍️</span>
            </div>
            <div className={styles.cardValue}>{firebaseStats.totalWrites.toLocaleString()}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Deletes</h3>
              <span className={styles.icon}>🗑️</span>
            </div>
            <div className={styles.cardValue}>{firebaseStats.totalDeletes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Combined Cost Overview */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Total Infrastructure Cost</h2>
        <div className={styles.summaryCards}>
          <div className={styles.card} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className={styles.cardHeader}>
              <h3>Combined Total</h3>
              <span className={styles.icon}>💎</span>
            </div>
            <div className={styles.cardValue}>{formatCost(totalCost + firebaseStats.totalCost)}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
              OpenAI: {formatCost(totalCost)} + Firebase: {formatCost(firebaseStats.totalCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Collection Breakdown */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Firebase Collection Usage</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Collection</th>
                <th>Reads</th>
                <th>Writes</th>
                <th>Deletes</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(firebaseStats.operationBreakdown).map(([collection, stats]) => (
                <tr key={collection}>
                  <td>{collection}</td>
                  <td>{stats.reads.toLocaleString()}</td>
                  <td>{stats.writes.toLocaleString()}</td>
                  <td>{stats.deletes.toLocaleString()}</td>
                  <td>{formatCost(stats.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Statistics */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>User Cost Analysis</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>User Email</th>
                <th>Total Cost</th>
                <th>Total Tokens</th>
                <th>API Calls</th>
                <th>Avg Cost/Call</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((stats, index) => (
                <tr key={index}>
                  <td>{stats.email}</td>
                  <td>{formatCost(stats.totalCost)}</td>
                  <td>{formatTokens(stats.totalTokens)}</td>
                  <td>{stats.requestCount}</td>
                  <td>{formatCost(stats.totalCost / stats.requestCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Usage Log */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Detailed Usage Log</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Function</th>
                <th>Prompt Tokens</th>
                <th>Completion Tokens</th>
                <th>Total Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {tokenUsages.slice(0, 100).map((usage) => (
                <tr key={usage.id}>
                  <td>{formatDate(usage.timestamp)}</td>
                  <td>{usage.userEmail}</td>
                  <td>{getFunctionDisplayName(usage.functionName)}</td>
                  <td>{formatTokens(usage.promptTokens)}</td>
                  <td>{formatTokens(usage.completionTokens)}</td>
                  <td>{formatTokens(usage.totalTokens)}</td>
                  <td>{formatCost(usage.cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tokenUsages.length > 100 && (
          <p className={styles.note}>Showing first 100 records. Use filters to narrow down results.</p>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
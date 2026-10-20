import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

const menuItems = [
  'Dashboard',
  'Notices',
  'Timetable',
  'Attendance',
  'Complaints',
  'Hostel & Mess',
  'Fee Reminders',
  'ID Requests',
  'AI Assistant',
]

const icons = ['⌂', '▤', '▦', '▣', '☷', '⌂', '₹', '▣', '✦']

const timetable = {
  Monday: ['DWDM', 'CCE', 'FSD I LAB', 'FSD I LAB', 'ADV. JAVA', 'CN'],
  Tuesday: ['CCE', 'AT&CD', '—', 'CN', 'CN LAB', 'CN LAB'],
  Wednesday: ['DWDM', 'CN', 'FLUTTER LAB', 'FLUTTER LAB', 'AT&CD', 'ADV. JAVA'],
  Thursday: ['ADV. JAVA LAB', 'ADV. JAVA LAB', 'CRT', 'AT&CD', 'CCE', 'DWDM'],
  Friday: ['CN', 'AT&CD', 'ADV. JAVA', 'DWDM', 'AT&CD', 'ADV. JAVA'],
  Saturday: ['CCE', 'SS', 'SS', 'ADV. JAVA', 'DWDM', 'CN'],
}

const periodTimes = [
  '9:10–10:10',
  '10:10–11:10',
  '11:10–12:10',
  '1:00–2:00',
  '2:00–3:00',
  '3:00–4:00',
]

export default function App() {
  const [page, setPage] = useState('Dashboard')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [signUp, setSignUp] = useState(false)

  const [notices, setNotices] = useState([])
  const [noticeLoading, setNoticeLoading] = useState(true)
  const [noticeError, setNoticeError] = useState('')

  const [fees, setFees] = useState([])
  const [feesLoading, setFeesLoading] = useState(false)

  const [complaints, setComplaints] = useState([])
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [complaintTitle, setComplaintTitle] = useState('')
  const [complaintCategory, setComplaintCategory] = useState('General')
  const [complaintDescription, setComplaintDescription] = useState('')
  const [complaintMessage, setComplaintMessage] = useState('')

  const [idRequests, setIdRequests] = useState([])
  const [idLoading, setIdLoading] = useState(false)
  const [requestType, setRequestType] = useState('Replacement ID Card')
  const [reason, setReason] = useState('')
  const [idMessage, setIdMessage] = useState('')

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(
    'Ask me about notices, timetable, fees, complaints, ID requests, or hostel services.'
  )
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) setAuthError(error.message)
      setSession(data.session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) return
    loadNotices()
  }, [session])

  useEffect(() => {
    if (!session) return

    if (page === 'Fee Reminders') loadFees()
    if (page === 'Complaints') loadComplaints()
    if (page === 'ID Requests') loadIdRequests()
  }, [page, session])

  async function loadNotices() {
    setNoticeLoading(true)

    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setNoticeError(error.message)
    } else {
      setNoticeError('')
      setNotices(data || [])
    }

    setNoticeLoading(false)
  }

  async function loadFees() {
    setFeesLoading(true)

    const { data, error } = await supabase
      .from('fees')
      .select('*')

    setFees(error ? [{ _error: error.message }] : data || [])
    setFeesLoading(false)
  }

  async function loadComplaints() {
    setComplaintsLoading(true)

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })

    setComplaintMessage(error?.message || '')

    if (!error) setComplaints(data || [])

    setComplaintsLoading(false)
  }

  async function loadIdRequests() {
    setIdLoading(true)

    const { data, error } = await supabase
      .from('id_requests')
      .select('*')
      .order('created_at', { ascending: false })

    setIdMessage(error?.message || '')

    if (!error) setIdRequests(data || [])

    setIdLoading(false)
  }

  async function authSubmit(e) {
    e.preventDefault()
    setAuthError('')

    const result = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setAuthError(result.error.message)
    } else if (signUp && !result.data.session) {
      setAuthError('Account created. Check your email to confirm it.')
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
    } else {
      setPage('Dashboard')
    }
  }

  async function submitComplaint(e) {
    e.preventDefault()
    setComplaintMessage('Submitting...')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setComplaintMessage('Please sign in first.')
      return
    }

    const payload = {
      title: complaintTitle.trim(),
      category: complaintCategory,
      description: complaintDescription.trim(),
      student_id: user.id,
    }

    const result = await supabase
      .from('complaints')
      .insert([payload])

    if (result.error) {
      setComplaintMessage(result.error.message)
    } else {
      setComplaintMessage('Complaint submitted successfully.')
      setComplaintTitle('')
      setComplaintDescription('')
      await loadComplaints()
    }
  }

  async function deleteComplaint(complaintId) {
    const confirmed = window.confirm('Delete this complaint? This cannot be undone.')
    if (!confirmed) return

    setComplaintMessage('Deleting complaint...')

    const { data: authData, error: userError } = await supabase.auth.getUser()
    const user = authData?.user
    if (userError || !user) {
      setComplaintMessage('Please sign in again to delete your complaint.')
      return
    }

    // Delete only a complaint owned by the currently signed-in student.
    const { data, error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', complaintId)
      .eq('student_id', user.id)
      .select('id')

    if (error) {
      setComplaintMessage(`Could not delete complaint: ${error.message}`)
      return
    }

    if (!data || data.length === 0) {
      setComplaintMessage(
        'Nothing was deleted. Check that this complaint has your student_id and that the DELETE policy allows auth.uid() = student_id.'
      )
      await loadComplaints()
      return
    }

    setComplaintMessage('Complaint deleted successfully.')
    await loadComplaints()
  }

  async function submitId(e) {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIdMessage('Please sign in first.')
      return
    }

    const { error } = await supabase
      .from('id_requests')
      .insert({
        student_id: user.id,
        request_type: requestType,
        reason: reason.trim(),
      })

    if (error) {
      setIdMessage(error.message)
    } else {
      setIdMessage('ID request submitted successfully.')
      setReason('')
      await loadIdRequests()
    }
  }

    
  async function ask(e) {
    e.preventDefault()
    const q = question.trim().toLowerCase()
    if (!q) return

    setAnswer('Thinking...')

    try {
      // ATTENDANCE: fetch live records from Supabase
      if (q.includes('attendance') || q.includes('percentage')) {
        const { data: { user }, error: userError } =
          await supabase.auth.getUser()

        if (userError || !user) {
          setAnswer('Please log in again to check your attendance.')
          return
        }

        const { data, error } = await supabase
          .from('attendance')
          .select('subject, total_classes, attended_classes')
          .eq('student_id', user.id)
          .order('subject', { ascending: true })

        if (error) throw error

        if (!data?.length) {
          setAnswer('No attendance records found for your account.')
          return
        }

        const attended = data.reduce(
          (sum, item) => sum + Number(item.attended_classes || 0), 0
        )
        const total = data.reduce(
          (sum, item) => sum + Number(item.total_classes || 0), 0
        )

        const subjects = data.map(item => {
          const a = Number(item.attended_classes || 0)
          const t = Number(item.total_classes || 0)
          const pct = t > 0 ? `${((a / t) * 100).toFixed(1)}%` : 'N/A'
          return `${item.subject}: ${a}/${t} classes (${pct})`
        }).join('\n')

        const overall = total > 0
          ? ((attended / total) * 100).toFixed(2)
          : '0.00'

        setAnswer(
          `Your overall attendance is ${overall}%.\nYou attended ${attended} out of ${total} classes.\n\nSubject-wise attendance:\n${subjects}`
        )

      // MESS AND FOOD TIMINGS
      } else if (
        q.includes('mess') || q.includes('breakfast') ||
        q.includes('lunch') || q.includes('dinner') ||
        q.includes('snacks') || q.includes('food timing') ||
        q.includes('food time')
      ) {
        if (q.includes('breakfast')) {
          setAnswer('Breakfast timing: 7:30 AM – 9:00 AM.')
        } else if (q.includes('lunch')) {
          setAnswer('Lunch timing: 12:30 PM – 2:00 PM.')
        } else if (q.includes('snack')) {
          setAnswer('Snacks timing: 4:30 PM – 5:30 PM.')
        } else if (q.includes('dinner')) {
          setAnswer('Dinner timing: 7:30 PM – 9:00 PM.')
        } else {
          setAnswer(
            'Hostel mess timings:\nBreakfast: 7:30–9:00 AM\nLunch: 12:30–2:00 PM\nSnacks: 4:30–5:30 PM\nDinner: 7:30–9:00 PM'
          )
        }

      // LATEST NOTICES FROM SUPABASE
      } else if (q.includes('notice') || q.includes('announcement')) {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error

        setAnswer(
          data?.length
            ? 'Latest campus notices:\n' +
              data.map((item, i) =>
                `${i + 1}. ${item.title || item.subject || 'Campus notice'}${item.description ? ` — ${item.description}` : ''}`
              ).join('\n')
            : 'There are no campus notices available right now.'
        )

      // FEE INFORMATION
      } else if (q.includes('fee') || q.includes('payment') || q.includes('due date')) {
        const { data, error } = await supabase
          .from('fees')
          .select('*')

        if (error) throw error

        setAnswer(
          data?.length
            ? 'Your available fee records:\n' +
              data.map(item => {
                const name = item.fee_name || item.fee_type || item.title || item.name || 'Fee'
                const amount = item.amount ?? item.total_amount ?? item.fee_amount
                const due = item.due_date || item.due_on
                const status = item.payment_status || item.status
                return `${name}${amount != null ? ` — Amount: ₹${amount}` : ''}${due ? ` — Due: ${due}` : ''}${status ? ` — Status: ${status}` : ''}`
              }).join('\n')
            : 'No fee records are available right now.'
        )

      
      // TODAY'S OR SPECIFIC DAY TIMETABLE
      } else if (
        q.includes('timetable') ||
        q.includes('class schedule') ||
        q.includes('today class') ||
        q.includes('period') ||
        q.includes('schedule') ||
        q.includes('monday') ||
        q.includes('tuesday') ||
        q.includes('wednesday') ||
        q.includes('thursday') ||
        q.includes('friday') ||
        q.includes('saturday') ||
        q.includes('sunday')
      ) {
        const days = Object.keys(timetable)
        const requestedDay = days.find(day =>
          q.includes(day.toLowerCase())
        )

        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long'
        })

        const day = requestedDay || today
        const periods = timetable[day]

        if (!periods) {
          setAnswer(
            day === 'Sunday'
              ? 'There is no regular timetable available for Sunday.'
              : `No timetable is available for ${day}.`
          )
        } else {
          const times = [
            '9:10–10:10 AM',
            '10:10–11:10 AM',
            '11:10 AM–12:10 PM',
            '1:00–2:00 PM',
            '2:00–3:00 PM',
            '3:00–4:00 PM'
          ]

          const schedule = periods.map((subject, i) =>
            `Period ${i + 1}, ${times[i]}: ${subject}`
          ).join('\n')

          setAnswer(`${day}'s timetable:\n${schedule}`)
        }


      
      // ID REQUEST STATUS
      } else if (
        q.includes('id') &&
        (q.includes('status') || q.includes('request'))
      ) {
        const { data: { user }, error: userError } =
          await supabase.auth.getUser()

        if (userError || !user) {
          setAnswer('Please log in again to check your ID request.')
          return
        }

        const { data, error } = await supabase
          .from('id_requests')
          .select('request_type, status')
          .eq('student_id', user.id)

        if (error) throw error

        setAnswer(
          data?.length
            ? 'Your ID request status:\n' +
              data.map(item =>
                `${item.request_type}: ${item.status || 'Status unavailable'}`
              ).join('\n')
            : 'No ID requests found for your account.'
        )
          
      // COMPLAINT STATUS
      } else if (
        q.includes('complaint') &&
        (q.includes('status') || q.includes('my complaint') || q.includes('track'))
      ) {
        const { data: authData, error: userError } =
          await supabase.auth.getUser()

        const user = authData?.user

        if (userError || !user) {
          setAnswer('Please log in again to check your complaint status.')
          return
        }

        const { data, error } = await supabase
          .from('complaints')
          .select('id, title, status')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setAnswer(
          data?.length
            ? 'Your complaint status:\n' +
              data.map(item =>
                `${item.title}: ${item.status || 'Status unavailable'}`
              ).join('\n')
            : 'No complaints linked to your account were found. Existing records may be missing student_id.'
        )
      } else if (q.includes('complaint') || q.includes('report an issue')) {
        setAnswer(
          'To submit a complaint, open Complaints, enter the title, select a category, describe the issue, and submit it.'
        )


      


      // HOSTEL SERVICES
      } else if (q.includes('hostel')) {
        setAnswer(
          'Hostel mess timings:\nBreakfast: 7:30–9:00 AM\nLunch: 12:30–2:00 PM\nSnacks: 4:30–5:30 PM\nDinner: 7:30–9:00 PM\n\nFor hostel issues, use Complaints to submit a report.'
        )

      } else {
        setAnswer(
          'Hi! Ask me about your attendance, subject-wise percentages, latest notices, fee records, today’s timetable, mess timings, complaints, or ID card requests.'
        )
      }
    } catch (err) {
      setAnswer(`Sorry, I could not retrieve that information: ${err.message}`)
    }
  }


  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setAnswer('Voice input is not supported in this browser. Please try Google Chrome.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setAnswer('Could not hear you. Allow microphone access and try again.')
    }
    recognition.onresult = (event) => setQuestion(event.results[0][0].transcript)
    recognition.start()
  }

  

function speakAnswer() {
  if (!('speechSynthesis' in window)) {
    setAnswer('Voice output is not supported in this browser.')
    return
  }

  window.speechSynthesis.cancel()

  
const spokenText = answer
  .replace(/(\d+)\s*\/\s*(\d+)\s*classes/gi, '$1 classes out of $2 classes')
  .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 out of $2')
  .replace(/9:10\s*[–-]\s*10:10\s*AM/gi, 'nine ten AM to ten ten AM')
  .replace(/10:10\s*[–-]\s*11:10\s*AM/gi, 'ten ten AM to eleven ten AM')
  .replace(/11:10\s*AM\s*[–-]\s*12:10\s*PM/gi, 'eleven ten AM to twelve ten PM')
  .replace(/11:10\s*[–-]\s*12:10/gi, 'eleven ten to twelve ten')
  .replace(/1:00\s*[–-]\s*2:00\s*PM/gi, 'one PM to two PM')
  .replace(/2:00\s*[–-]\s*3:00\s*PM/gi, 'two PM to three PM')
  .replace(/3:00\s*[–-]\s*4:00\s*PM/gi, 'three PM to four PM')
  .replace(/7:30\s*[–-]\s*9:00\s*AM/gi, 'seven thirty AM to nine AM')
  .replace(/12:30\s*[–-]\s*2:00\s*PM/gi, 'twelve thirty PM to two PM')
  .replace(/4:30\s*[–-]\s*5:30\s*PM/gi, 'four thirty PM to five thirty PM')
  .replace(/7:30\s*[–-]\s*9:00\s*PM/gi, 'seven thirty PM to nine PM')
  .replace(/(\d{1,2}):00\s*AM/gi, '$1 AM')
  .replace(/(\d{1,2}):00\s*PM/gi, '$1 PM')

const utterance = new SpeechSynthesisUtterance(spokenText)
utterance.lang = 'en-IN'
window.speechSynthesis.speak(utterance)




  if (authLoading) {
    return <div className="empty-panel">Checking login...</div>
  }

  if (!session) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={authSubmit}>
          <h1>SmartCampus</h1>
          <p>Sign in to access your student portal</p>

          <label htmlFor="email">College Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your college email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter your password"
          />

          {authError && <p className="auth-error">{authError}</p>}

          <button className="primary-button" type="submit">
            {signUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            className="text-button"
            type="button"
            onClick={() => {
              setSignUp(!signUp)
              setAuthError('')
            }}
          >
            {signUp
              ? 'Already have an account? Sign in'
              : 'New student? Create account'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SmartCampus</h2>
            <span>STUDENT PORTAL</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="navigation">
          {menuItems.map((item, i) => (
            <button
              key={item}
              className={page === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setPage(item)}
            >
              <span className="nav-icon">{icons[i]}</span>
              {item}
              {item === 'Notices' && (
                <span className="nav-count">{notices.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">ST</div>
          <div>
            <strong>Student</strong>
            <span>{session.user?.email || 'Student Account'}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {page}</p>
            <h1>{page}</h1>
          </div>

          <div className="topbar-right">
            <span className="status-dot" />
            <span>Student Portal</span>
            <button className="text-button" onClick={logout}>
              Logout
            </button>
            <div className="top-avatar">ST</div>
          </div>
        </header>

        <section className="page-content">
          {page === 'Dashboard' && (
            <>
              <div className="welcome-banner">
                <div>
                  <p className="eyebrow">YOUR CAMPUS, CONNECTED</p>
                  <h2>Welcome back, Student! 👋</h2>
                  <p>
                    Manage your campus services and stay updated with everything
                    happening around you.
                  </p>
                </div>
                <div className="banner-symbol">✦</div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Your Services</h2>
                  <p>Everything you need, in one place.</p>
                </div>
              </div>

              <div className="stats-grid">
                <ServiceCard
                  icon="▤"
                  color="purple"
                  label="CAMPUS UPDATES"
                  title="Notices"
                  description={`${notices.length} notices available`}
                  link="View notices →"
                  onClick={() => setPage('Notices')}
                />
                <ServiceCard
                  icon="▦"
                  color="blue"
                  label="YOUR SCHEDULE"
                  title="Timetable"
                  description="Check your class schedule"
                  link="View timetable →"
                  onClick={() => setPage('Timetable')}
                />
                <ServiceCard
                  icon="▣"
                  color="teal"
                  label="ACADEMIC TRACKER"
                  title="Attendance"
                  description="View subject-wise attendance"
                  link="View attendance →"
                  onClick={() => setPage('Attendance')}
                />
                <ServiceCard
                  icon="☷"
                  color="orange"
                  label="STUDENT SUPPORT"
                  title="Complaints"
                  description="Report and track issues"
                  link="Open complaints →"
                  onClick={() => setPage('Complaints')}
                />
                <ServiceCard
                  icon="⌂"
                  color="green"
                  label="CAMPUS LIVING"
                  title="Hostel & Mess"
                  description="Access hostel information"
                  link="Explore services →"
                  onClick={() => setPage('Hostel & Mess')}
                />
                <ServiceCard
                  icon="₹"
                  color="yellow"
                  label="PAYMENT TRACKER"
                  title="Fee Reminders"
                  description="Keep track of fee deadlines"
                  link="View reminders →"
                  onClick={() => setPage('Fee Reminders')}
                />
                <ServiceCard
                  icon="▣"
                  color="teal"
                  label="STUDENT DOCUMENTS"
                  title="ID Requests"
                  description="Manage ID card requests"
                  link="View requests →"
                  onClick={() => setPage('ID Requests')}
                />
              </div>

              <div className="section-heading notices-heading">
                <div>
                  <h2>Latest Notices</h2>
                  <p>Updates published by your campus.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setPage('Notices')}
                >
                  View all →
                </button>
              </div>

              <NoticeList
                notices={notices.slice(0, 3)}
                loading={noticeLoading}
                error={noticeError}
              />
            </>
          )}

          {page === 'Notices' && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Campus Notices</h2>
                  <p>Official updates from your campus database.</p>
                </div>
              </div>
              <NoticeList
                notices={notices}
                loading={noticeLoading}
                error={noticeError}
              />
            </>
          )}

          {page === 'Timetable' && <TimetablePage />}

          {page === 'Attendance' && <AttendancePage />}

          {page === 'Complaints' && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Complaints</h2>
                  <p>Report and track your campus issues.</p>
                </div>
              </div>

              <div className="id-request-card">
                <h3>Submit a Complaint</h3>
                <form className="id-request-form" onSubmit={submitComplaint}>
                  <label htmlFor="ctitle">Title</label>
                  <input
                    id="ctitle"
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    required
                    placeholder="Brief complaint title"
                  />

                  <label htmlFor="ccategory">Category</label>
                  <select
                    id="ccategory"
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                  >
                    <option>General</option>
                    <option>Hostel</option>
                    <option>Mess</option>
                    <option>Academics</option>
                    <option>Facilities</option>
                    <option>Other</option>
                  </select>

                  <label htmlFor="cdescription">Description</label>
                  <textarea
                    id="cdescription"
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    rows="4"
                    required
                    placeholder="Explain the issue"
                  />

                  {complaintMessage && <p>{complaintMessage}</p>}

                  <button className="primary-button" type="submit">
                    Submit Complaint
                  </button>
                </form>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Submitted Complaints</h2>
                  <p>Latest complaint records.</p>
                </div>
                <button className="text-button" onClick={loadComplaints}>
                  Refresh
                </button>
              </div>

              {complaintsLoading ? (
                <div className="empty-panel">Loading complaints...</div>
              ) : (
                <RecordList
                  rows={complaints}
                  empty="No complaints found yet."
                  kind="complaint"
                  currentUserId={session?.user?.id}
                  onDelete={deleteComplaint}
                />
              )}
            </>
          )}

          {page === 'Hostel & Mess' && (
            <>
              <div className="welcome-banner">
                <div>
                  <p className="eyebrow">CAMPUS LIVING</p>
                  <h2>Hostel & Mess</h2>
                  <p>Hostel services, mess menu, and food updates.</p>
                </div>
                <div className="banner-symbol">⌂</div>
              </div>

              <div className="stats-grid">
                <InfoCard
                  title="Hostel Services"
                  text="Room maintenance, water, electricity, and cleaning issues. Report problems through Complaints."
                />
                <InfoCard
                  title="Mess Menu"
                  text="Breakfast: 7:30–9:00 AM. Lunch: 12:30–2:00 PM. Snacks: 4:30–5:30 PM. Dinner: 7:30–9:00 PM."
                />
                <InfoCard
                  title="Food Updates"
                  text="Check campus notices for mess menu changes, food announcements, and meal timing updates."
                />
              </div>

              <div className="empty-panel">
                <h3>Need Help?</h3>
                <p>
                  For urgent hostel issues, contact your hostel warden or college
                  office.
                </p>
                <p>
                  To report a hostel or mess issue, choose the relevant category
                  in Complaints.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setPage('Complaints')}
                >
                  Open Complaints
                </button>
              </div>
            </>
          )}

          {page === 'Fee Reminders' && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Fee Reminders</h2>
                  <p>Amounts, due dates, and payment status from your database.</p>
                </div>
                <button className="text-button" onClick={loadFees}>
                  Refresh
                </button>
              </div>

              {feesLoading ? (
                <div className="empty-panel">Loading fee records...</div>
              ) : (
                <div className="notice-list">
                  {fees.map((f, i) => {
                    if (f._error) {
                      return (
                        <div className="empty-panel error-panel" key="fee-error">
                          <strong>Could not load fees</strong>
                          <p>{f._error}</p>
                        </div>
                      )
                    }

                    const amount = f.amount ?? f.total_amount ?? f.fee_amount
                    const name =
                      f.fee_name || f.fee_type || f.title || f.name || 'Fee'
                    const due = f.due_date || f.due_on
                    const status = String(
                      f.payment_status || f.status || 'Not specified'
                    )
                    const normalizedStatus = status.toLowerCase()

                    // This demo assumes "Partial" means 50% has been paid.
                    const paidAmount =
                      normalizedStatus === 'cleared'
                        ? Number(amount || 0)
                        : normalizedStatus === 'partial'
                          ? Number(amount || 0) / 2
                          : 0

                    const remainingAmount = Math.max(
                      0,
                      Number(amount || 0) - paidAmount
                    )

                    const displayName =
                      name === 'College Tution Fee'
                        ? 'College Tuition Fee'
                        : name

                    return (
                      <article className="notice-card" key={f.id || i}>
                        <div className="notice-symbol">₹</div>
                        <div className="notice-body">
                          <div className="notice-meta">
                            <span className="category-tag">{status}</span>
                            <span>
                              {due
                                ? new Date(due).toLocaleDateString()
                                : 'Due date not set'}
                            </span>
                          </div>

                          <h3>{displayName}</h3>
                          <p>
                            Total Fee:{' '}
                            {amount == null
                              ? 'Not provided'
                              : `₹${Number(amount).toLocaleString('en-IN')}`}
                          </p>
                          <p>Paid: ₹{paidAmount.toLocaleString('en-IN')}</p>
                          <p>
                            Remaining: ₹
                            {remainingAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </article>
                    )
                  })}

                  {!fees.length && !feesLoading && (
                    <div className="empty-panel">No fee records found.</div>
                  )}
                </div>
              )}
            </>
          )}

          {page === 'ID Requests' && (
            <>
              <div className="section-heading">
                <div>
                  <h2>ID Requests</h2>
                  <p>Submit and track your student ID card requests.</p>
                </div>
              </div>

              <div className="id-request-card">
                <h3>Request a Student ID Card</h3>
                <form className="id-request-form" onSubmit={submitId}>
                  <label htmlFor="rtype">Request Type</label>
                  <select
                    id="rtype"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <option>New ID Card</option>
                    <option>Replacement ID Card</option>
                    <option>Damaged ID Card</option>
                  </select>

                  <label htmlFor="reason">Reason</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="4"
                    required
                    placeholder="Enter the reason for your request"
                  />

                  {idMessage && <p>{idMessage}</p>}

                  <button className="primary-button" type="submit">
                    Submit Request
                  </button>
                </form>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Your Requests</h2>
                  <p>Current status of your requests.</p>
                </div>
                <button className="text-button" onClick={loadIdRequests}>
                  Refresh
                </button>
              </div>

              {idLoading ? (
                <div className="empty-panel">Loading ID requests...</div>
              ) : (
                <RecordList
                  rows={idRequests}
                  empty="No ID requests found yet."
                  kind="id"
                />
              )}
            </>
          )}

          {page === 'AI Assistant' && (
            <>
              <div className="welcome-banner">
                <div>
                  <p className="eyebrow">SMARTCAMPUS HELP</p>
                  <h2>AI Assistant ✦</h2>
                  <p>Ask for guidance on common student portal tasks.</p>
                </div>
                <div className="banner-symbol">✦</div>
              </div>

              <div className="id-request-card">
                <form className="id-request-form" onSubmit={ask}>
                  <label htmlFor="question">Your question</label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows="3"
                    required
                    placeholder="e.g. How do I submit an ID request?"
                  />
                  <button className="primary-button" type="submit">
                    Ask Assistant
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                    <button className="text-button" type="button" onClick={startListening} disabled={isListening}>
                      {isListening ? '🎙️ Listening...' : '🎙️ Speak Question'}
                    </button>
                    <button className="text-button" type="button" onClick={speakAnswer}>
                      🔊 Speak Answer
                    </button>
                  </div>
                </form>

                <div className="empty-panel">
                  <strong>Assistant response</strong>
                  <p>{answer}</p>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="footer">
          <span>SmartCampus © 2026</span>
          <span>One campus. One platform.</span>
        </footer>
      </main>
    </div>
  )
}
function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function fetchAttendance() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (mounted) {
          setError('Please log in again to view attendance.')
          setLoading(false)
        }
        return
      }
      const { data, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('subject', { ascending: true })
      if (mounted) {
        if (fetchError) setError(fetchError.message)
        else setAttendanceRecords(data || [])
        setLoading(false)
      }
    }
    fetchAttendance()
    return () => { mounted = false }
  }, [])

  const attendedTotal = attendanceRecords.reduce((sum, item) => sum + Number(item.attended_classes || 0), 0)
  const classesTotal = attendanceRecords.reduce((sum, item) => sum + Number(item.total_classes || 0), 0)
  const overall = classesTotal > 0 ? (attendedTotal / classesTotal) * 100 : null

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <p className="eyebrow">ACADEMIC TRACKER</p>
          <h2>Attendance Overview 📊</h2>
          <p>Your subject-wise attendance fetched from Supabase.</p>
        </div>
        <div className="banner-symbol">%</div>
      </div>
      {loading ? <div className="empty-panel">Loading attendance...</div> : error ? (
        <div className="empty-panel"><strong>Could not load attendance</strong><p>{error}</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <InfoCard title="Classes Attended" text={`${attendedTotal} attended classes`} />
            <InfoCard title="Total Classes" text={`${classesTotal} total classes`} />
            <InfoCard title="Overall Attendance" text={overall !== null ? `${overall.toFixed(2)}%` : 'No attendance data'} />
          </div>
          <div className="section-heading"><div><h2>Subject-wise Attendance</h2><p>Records loaded from your attendance table.</p></div></div>
          {attendanceRecords.length === 0 ? <div className="empty-panel">No attendance records found for your account. Check student_id in Supabase.</div> : (
            <div className="notice-list">
              {attendanceRecords.map((item, index) => {
                const attended = Number(item.attended_classes || 0)
                const total = Number(item.total_classes || 0)
                const percentage = total > 0 ? (attended / total) * 100 : null
                return <article className="notice-card" key={item.id || item.subject || index}>
                  <div className="notice-symbol">%</div>
                  <div className="notice-body">
                    <div className="notice-meta"><span className="category-tag">{percentage !== null ? 'Recorded' : 'Data needed'}</span><span>{percentage !== null ? `${percentage.toFixed(1)}%` : '—'}</span></div>
                    <h3>{item.subject || 'Subject'}</h3>
                    <p>{percentage !== null ? `Attended ${attended} out of ${total} classes` : 'Class counts are not available for this subject.'}</p>
                  </div>
                </article>
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TimetablePage() {
  const [day, setDay] = useState('Monday')

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <p className="eyebrow">YOUR ACADEMIC SCHEDULE</p>
          <h2>Class Timetable 📚</h2>
          <p>III B.Tech · IT · Semester I · A.Y. 2025–2026</p>
        </div>
        <div className="banner-symbol">▦</div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Weekly Schedule</h2>
          <p>Select a day to view your classes.</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {Object.keys(timetable).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            style={{
              padding: '10px 15px',
              borderRadius: 10,
              border: day === d ? '1px solid #7154d9' : '1px solid #eeedf5',
              background: day === d ? '#f0ecff' : '#fff',
              fontWeight: 700,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="notice-list">
        {timetable[day].map((subject, i) => (
          <article className="notice-card" key={`${day}-${i}`}>
            <div className="notice-symbol">{i + 1}</div>
            <div className="notice-body">
              <div className="notice-meta">
                <span className="category-tag">Period {i + 1}</span>
                <span>{periodTimes[i]}</span>
              </div>
              <h3>{subject}</h3>
            </div>
          </article>
        ))}
      </div>

      <div className="empty-panel">
        <strong>Lunch Break</strong>
        <p>12:10 PM – 1:00 PM</p>
      </div>
    </div>
  )
}

function ServiceCard(p) {
  return (
    <button className="service-card" onClick={p.onClick}>
      <div className={'service-icon ' + p.color}>{p.icon}</div>
      <span className="card-label">{p.label}</span>
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <span className="card-link">{p.link}</span>
    </button>
  )
}

function InfoCard({ title, text }) {
  return (
    <article className="notice-card">
      <div className="notice-symbol">✦</div>
      <div className="notice-body">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  )
}

function NoticeList({ notices, loading, error }) {
  if (loading) {
    return <div className="empty-panel">Loading campus notices...</div>
  }

  if (error) {
    return (
      <div className="empty-panel error-panel">
        <strong>Could not load notices</strong>
        <p>{error}</p>
      </div>
    )
  }

  if (!notices.length) {
    return <div className="empty-panel">No notices available yet.</div>
  }

  return (
    <div className="notice-list">
      {notices.map((n) => (
        <article className="notice-card" key={n.id}>
          <div className="notice-symbol">▤</div>
          <div className="notice-body">
            <div className="notice-meta">
              <span className="category-tag">{n.category || 'General'}</span>
              {n.created_at && (
                <span>{new Date(n.created_at).toLocaleDateString()}</span>
              )}
            </div>
            <h3>{n.title}</h3>
            <p>{n.description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function RecordList({ rows, empty, kind, currentUserId, onDelete }) {
  if (!rows.length) {
    return <div className="empty-panel">{empty}</div>
  }

  return (
    <div className="notice-list">
      {rows.map((r, i) => (
        <article className="notice-card" key={r.id || i}>
          <div className="notice-symbol">
            {kind === 'id' ? '▣' : '☷'}
          </div>
          <div className="notice-body">
            <div className="notice-meta">
              <span className="category-tag">{r.status || 'Submitted'}</span>
              {r.created_at && (
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              )}
            </div>
            <h3>{kind === 'id' ? r.request_type : r.title}</h3>
            <p>{kind === 'id' ? r.reason : r.description}</p>
            {kind === 'complaint' &&
              currentUserId &&
              r.student_id === currentUserId &&
              onDelete && (
                <button
                  type="button"
                  className="text-button"
                  style={{ color: '#c62828', marginTop: '10px' }}
                  onClick={() => onDelete(r.id)}
                >
                  Delete Complaint
                </button>
              )}
          </div>
        </article>
      ))}
    </div>
  )
}
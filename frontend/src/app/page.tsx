'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Heart, Zap, Award, BookOpen, ChevronRight, CheckCircle, XCircle,
    Loader2, User, Star, TrendingUp, Trophy, Egg, LayoutDashboard, Menu, X, MonitorPlay, MessageSquare, Timer,
    List, Plus, Trash2, Clock, Search, Ruler, FlaskRound, Calculator, Dna, ExternalLink
} from 'lucide-react';


interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
    topic: string;
    selectedAnswer: string | null;
    isCorrect: boolean | null;
}

interface QuizData {
    quiz_title: string;
    questions: Question[];
}

interface TrainerCardData {
    user_id: string;
    username: string;
    level: number;
    xp: number;
    streak: number;
}

interface PokemonPanelData {
    name: string;
    xp_stat: string;
    total_xp: number;
    evolution_status: string;
    image_url: string;
}

interface DashboardData {
    trainer_card: TrainerCardData;
    pokemon_panel: PokemonPanelData;
    achievements: { badges: number };
    last_weak_topics: string[];
}

interface LeaderboardEntry {
    username: string;
    xp: number;
    level: number;
    pokemon_name: string;
}

type LoggedInScreen = 'dashboard' | 'leaderboard' | 'quiz_select' | 'quiz_battle' | 'feedback' | 'resources' | 'todo_list';
type Screen = 'landing' | 'login' | 'main';
type AppTheme = 'pokemon_kalos' | 'one_piece' | 'default';


const POMODORO_WORK_DURATION = 25 * 60; // 25 mins in seconds
const POMODORO_BREAK_DURATION = 5 * 60; // 5 mins in seconds


const getPokemonImageUrl = (name: string): string => {
    switch (name.toLowerCase()) {
        case 'pikachu': return '/images/pikachu_starter.png';
        case 'bulbasaur': return '/images/bulbasaur_starter.png';
        case 'charmander': return '/images/charmander_starter.png';
        case 'squirtle': return '/images/squirtle_starter.png';
        case 'turtwig': return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png';
        default: return 'https://placehold.co/128x128/999999/white?text=Partner+Pokemon';
    }
};


const getThemeStyles = (theme: AppTheme) => {
    if (theme === 'one_piece') {
        return {
            bg: 'bg-gray-900/90',
            border: 'border-yellow-500/70',
            titleColor: 'text-red-600',
            borderColor: 'border-red-600',
            accentBg: 'bg-red-600 hover:bg-red-700',
            accentColor: 'text-yellow-500',
            listItemBorder: 'border-yellow-500',
            inputFocus: 'focus:border-red-500',
        };
    }

    return {
        bg: 'bg-slate-900/90',
        border: 'border-blue-600/70',
        titleColor: 'text-cyan-400',
        borderColor: 'border-cyan-500',
        accentBg: 'bg-blue-600 hover:bg-blue-700',
        accentColor: 'text-cyan-400',
        listItemBorder: 'border-red-500',
        inputFocus: 'focus:border-blue-500',
    };
};


const useAuth = () => {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [theme, setTheme] = useState<AppTheme>('pokemon_kalos');

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUserId = localStorage.getItem('user_id');
        const storedTheme = localStorage.getItem('app_theme') as AppTheme;
        if (storedToken && storedUserId) {
            setToken(storedToken);
            setUserId(storedUserId);
            setIsLoggedIn(true);
            setTheme(storedTheme || 'pokemon_kalos');
        }
    }, []);

    const login = (authToken: string, uid: string, appTheme: AppTheme) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_id', uid);
        localStorage.setItem('app_theme', appTheme);
        setToken(authToken);
        setUserId(uid);
        setTheme(appTheme);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('app_theme');
        setToken(null);
        setUserId(null);
        setTheme('default');
        setIsLoggedIn(false);
    };

    return { token, userId, isLoggedIn, theme, login, logout };
};


interface QuizQuestionProps {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    handleOptionSelect: (option: string) => void;
    isSubmissionReview: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
    question,
    questionIndex,
    totalQuestions,
    handleOptionSelect,
    isSubmissionReview,
}) => {
    const { question: text, options, selectedAnswer, answer, topic } = question;

    const getOptionClasses = (option: string) => {
        let classes = 'p-4 my-3 rounded-xl transition-all duration-300 border-2 text-lg font-semibold relative overflow-hidden ';

        if (isSubmissionReview) {
            if (option === answer) {
                classes += 'bg-emerald-700/30 border-emerald-400 text-white shadow-lg shadow-emerald-500/30';
            } else if (option === selectedAnswer && option !== answer) {
                classes += 'bg-rose-700/30 border-rose-400 text-white shadow-lg shadow-rose-500/30';
            } else {
                classes += 'bg-slate-700/50 border-slate-600 text-gray-300 opacity-60';
            }
        } else {
            classes += 'cursor-pointer hover:bg-blue-600/50 hover:shadow-cyan-400/40';
            if (option === selectedAnswer) {
                classes += 'bg-blue-600 border-cyan-400 shadow-xl shadow-cyan-500/50 text-white';
            } else {
                classes += 'bg-slate-700/80 border-slate-600 text-gray-200 hover:bg-slate-600';
            }
        }
        return classes;
    };

    return (
        <div className="bg-slate-800/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border-4 border-cyan-500/70 w-full mx-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-cyan-700">
                <div className="text-sm font-black text-cyan-400 tracking-wider bg-cyan-900/50 px-3 py-1 rounded-full">
                    BATTLE {questionIndex + 1} / {totalQuestions}
                </div>
                <div className="text-xs text-gray-400 italic bg-slate-700 px-3 py-1 rounded-full">{topic}</div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">{text}</h3>

            {options.map((option, index) => (
                <div
                    key={index}
                    className={getOptionClasses(option)}
                    onClick={!isSubmissionReview ? () => handleOptionSelect(option) : undefined}
                >
                    <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isSubmissionReview && option === answer && (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                        {isSubmissionReview && option === selectedAnswer && option !== answer && (
                            <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                    </div>
                </div>
            ))}

            {isSubmissionReview && selectedAnswer && (
                <p className={`mt-6 p-3 rounded-lg text-sm font-bold ${question.isCorrect ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500' : 'bg-rose-900/50 text-rose-300 border border-rose-500'}`}>
                    {question.isCorrect ? '✓ Excellent! Trainer Level UP!' : `✗ Failure to capture! Correct Answer: "${answer}".`}
                </p>
            )}
        </div>
    );
};



interface QuizBattleProps {
    subject: string;
    onQuizComplete: (data: { score: number; weak_topics: string[] }) => void;
    onExit: () => void;
}

const QuizBattle: React.FC<QuizBattleProps> = ({ subject, onQuizComplete, onExit }) => {
    const { token } = useAuth();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isReviewing, setIsReviewing] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<any>(null);

    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (quiz && !isReviewing) {
            setTimeLeft(60);
        }
    }, [currentQuestionIndex, quiz, isReviewing]);

    useEffect(() => {
        if (loading || isReviewing || !quiz) return;

        if (timeLeft <= 0) {
            handleTimeExpired();
            return;
        }

        const timerId = setTimeout(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [timeLeft, currentQuestionIndex, loading, isReviewing, quiz]);

    const handleTimeExpired = () => {
        if (!quiz) return;

        setQuiz(prevQuiz => {
            if (!prevQuiz) return null;

            const updatedQuestions = prevQuiz.questions.map((q, index) => {
                if (index === currentQuestionIndex && q.selectedAnswer === null) {
                    return { ...q, selectedAnswer: "Time Expired / No Answer", isCorrect: false };
                }
                return q;
            });

            return { ...prevQuiz, questions: updatedQuestions };
        });

        handleNext(true);
    };

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const maxRetries = 3;
            let response = null;
            let data = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/generate_quiz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ subject }),
                    });

                    data = await response.json();

                    if (response.ok && !data.error) {
                        break;
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || 'Failed to generate quiz after multiple retries.');
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }

            const initializedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
                ...q,
                id: index,
                selectedAnswer: null,
                isCorrect: null,
            }));

            setQuiz({ ...data, questions: initializedQuestions });
            setTimeLeft(60);
        } catch (err: any) {
            console.error("Quiz Fetch Error:", err);
            setError(err.message || "An unknown error occurred while fetching the quiz.");
        } finally {
            setLoading(false);
        }
    }, [subject, token]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleOptionSelect = (option: string) => {
        if (isReviewing) return;

        setQuiz(prevQuiz => {
            if (!prevQuiz) return null;

            const updatedQuestions = prevQuiz.questions.map((q, index) => {
                if (index === currentQuestionIndex) {
                    const isCorrect = option === q.answer;
                    return { ...q, selectedAnswer: option, isCorrect };
                }
                return q;
            });

            return { ...prevQuiz, questions: updatedQuestions };
        });
    };

    const handleNext = (forceSubmit = false) => {
        if (!forceSubmit && (!quiz || !quiz.questions[currentQuestionIndex].selectedAnswer)) {
            return;
        }

        setTimeLeft(60);

        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (!quiz) return;

        let score = 0;
        const topicIncorrectCounts: Record<string, number> = {};

        quiz.questions.forEach(q => {
            if (q.isCorrect) {
                score++;
            } else {
                if (q.topic) {
                    topicIncorrectCounts[q.topic] = (topicIncorrectCounts[q.topic] || 0) + 1;
                }
            }
        });

        const finalWeakTopics = Object.keys(topicIncorrectCounts).filter(topic => topicIncorrectCounts[topic] > 0);

        setLoading(true);

        const submitQuiz = async () => {
            const maxRetries = 3;
            let response = null;
            let data = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/submit_quiz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            subject,
                            score,
                            total_questions: quiz.questions.length,
                            new_weak_topics: finalWeakTopics,
                        }),
                    });

                    data = await response.json();

                    if (response.ok && !data.error) {
                        return { ...data, weak_topics: finalWeakTopics };
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || 'Failed to submit quiz after multiple retries.');
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }

        submitQuiz()
            .then(data => {
                setLoading(false);
                setIsReviewing(true);
                setSubmissionResult(data);
                setCurrentQuestionIndex(0);
            })
            .catch(err => {
                console.error("Submission Error:", err);
                setError(err.message || "Failed to submit results.");
                setLoading(false);
            });

    };

    const handleReviewComplete = () => {
        if (submissionResult) {
            onQuizComplete(submissionResult);
        } else {
            onExit();
        }
    };

    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-3xl shadow-2xl h-96 w-full max-w-2xl mx-auto border-4 border-cyan-500">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                <p className="text-white font-black text-xl">Generating Kalos Battle Quiz on {subject}...</p>
                <p className="text-sm text-cyan-300 mt-1">Preparing the battlefield!</p>
            </div>
        );
    }

    if (error || !currentQuestion) {
        return (
            <div className="p-10 bg-rose-900/50 border border-rose-500 rounded-xl shadow-2xl w-full max-w-2xl mx-auto text-rose-300">
                <h3 className="text-xl font-bold text-rose-400 mb-3">Quiz Error</h3>
                <p className="text-rose-300">{error || "Quiz data is unavailable."}</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-md"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const isLastQuestion = currentQuestionIndex === quiz!.questions.length - 1;
    const nextButtonText = isLastQuestion ? 'Submit Quiz' : 'Next Question';
    const nextButtonDisabled = !currentQuestion.selectedAnswer && !isReviewing;

    const timerClasses = `text-3xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-white mb-8 text-center pb-3 drop-shadow-md">
                {isReviewing ? 'Battle Recap' : quiz!.quiz_title}
            </h2>

            {!isReviewing && (
                <div className="text-center mb-8">
                    <div className="p-4 bg-yellow-400 rounded-full shadow-xl inline-block border-4 border-slate-700 animate-bounce-slow">
                        <span className="text-xs text-black block mb-1 font-extrabold tracking-widest">TIME LEFT</span>
                        <span className={timerClasses}>{timeLeft}s</span>
                    </div>
                </div>
            )}

            <QuizQuestion
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={quiz!.questions.length}
                handleOptionSelect={handleOptionSelect}
                isSubmissionReview={isReviewing}
            />

            <div className={`mt-10 flex ${isReviewing ? 'justify-between' : 'justify-end'} space-x-6 w-full max-w-lg mx-auto`}>
                {isReviewing && (
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-3 bg-slate-700 text-gray-300 font-bold rounded-xl shadow-lg hover:bg-slate-600 transition disabled:opacity-50 border border-slate-600"
                    >
                        <ChevronRight className="inline w-5 h-5 mr-1 transform rotate-180" /> Back
                    </button>
                )}

                <button
                    onClick={isReviewing ? (isLastQuestion ? handleReviewComplete : () => setCurrentQuestionIndex(prev => prev + 1)) : () => handleNext(false)}
                    disabled={nextButtonDisabled}
                    className={`px-10 py-4 font-black text-xl rounded-2xl transition duration-300 transform shadow-2xl
                        ${isReviewing && isLastQuestion ?
                            'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/50' :
                            isReviewing ?
                                'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-400/50' :
                                nextButtonDisabled
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-red-500/50 animate-pulse-slow'
                        }
                    `}
                >
                    {isReviewing && !isLastQuestion ? 'Next Question' : nextButtonText} <ChevronRight className="inline w-6 h-6 ml-1" />
                </button>
            </div>

            {isReviewing && (
                <div className="mt-8 p-4 bg-cyan-900/50 border-4 border-cyan-500 rounded-xl w-full max-w-lg mx-auto shadow-inner">
                    <p className="text-center font-black text-2xl text-cyan-300">
                        Final Score: {quiz!.questions.filter(q => q.isCorrect).length} / {quiz!.questions.length}
                    </p>
                </div>
            )}
        </div>
    );
};


const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className="flex items-center p-4 bg-slate-800 rounded-xl shadow-lg border border-cyan-500/30 hover:border-cyan-500 transition duration-300">
        <div className="p-3 bg-blue-700 rounded-full mr-4 shadow-xl shadow-blue-500/30">
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-cyan-300' })}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
    </div>
);


interface DashboardProps {
    onStartQuiz: (subject: string) => void;
    dashboardData: DashboardData | null;
    onViewLeaderboard: () => void;
    pomodoroStatus: 'resting' | 'active' | 'breaking';
    pomodoroTimeLeft: number;
    handlePomodoroToggle: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ dashboardData, onViewLeaderboard, pomodoroStatus, pomodoroTimeLeft, handlePomodoroToggle }) => {

    const weakTopics = dashboardData?.last_weak_topics || [];
    const trainer = dashboardData?.trainer_card;
    const pokemon = dashboardData?.pokemon_panel;

    const xp_parts = pokemon?.xp_stat.split('/');
    const current_xp_mod = parseInt(xp_parts?.[0] || '0');
    const required_xp_mod = parseInt(xp_parts?.[1] || '300');
    const xp_percent = required_xp_mod > 0 ? Math.min(100, (current_xp_mod / required_xp_mod) * 100) : 0;

    const pokemonImageUrl = pokemon?.image_url || 'https://placehold.co/128x128/999999/white?text=Partner+Pokemon';

    const POMODORO_WORK_DURATION = 25 * 60;

    let fatigueBarPercent = 0;
    let fatigueBarColor = 'bg-green-500';
    let fatigueBarText = 'Ready to Train!';
    let timerMins = Math.floor(pomodoroTimeLeft / 60);
    let timerSecs = pomodoroTimeLeft % 60;
    const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

    if (pomodoroStatus === 'active') {
        const energyLeft = pomodoroTimeLeft;
        fatigueBarPercent = (energyLeft / POMODORO_WORK_DURATION) * 100;
        fatigueBarColor = fatigueBarPercent > 50 ? 'bg-emerald-500' : (fatigueBarPercent > 20 ? 'bg-yellow-500' : 'bg-rose-500');
        fatigueBarText = `Training Active: ${timerDisplay} left`;
    } else if (pomodoroStatus === 'breaking') {
        const breakElapsed = POMODORO_BREAK_DURATION - pomodoroTimeLeft;
        fatigueBarPercent = (breakElapsed / POMODORO_BREAK_DURATION) * 100;
        fatigueBarColor = 'bg-cyan-500';
        fatigueBarText = `Break Time: ${timerDisplay} left (Resting)`;
    } else { // resting
        fatigueBarPercent = 100;
        fatigueBarColor = 'bg-emerald-500';
    }

    const buttonText = pomodoroStatus === 'active' ? 'Training Active...' : (pomodoroStatus === 'breaking' ? 'Pokémon Resting...' : 'Start Pomodoro Mode');
    const buttonDisabled = pomodoroStatus !== 'resting';

    return (
        <div className="p-6 md:p-10 bg-slate-900/90 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-blue-600/70 backdrop-blur-md">
            <h1 className="text-3xl font-extrabold text-white mb-6 border-b-2 border-cyan-500 pb-4 drop-shadow-md">Kalos Trainer Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trainer Card & Stats */}
                <div className="lg:col-span-2 p-6 bg-slate-800 border-2 border-slate-700 rounded-xl shadow-inner shadow-black/50">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
                        <User className="w-6 h-6 mr-2 text-cyan-400" />
                        Trainer Card - Kalos ID
                    </h2>
                    {trainer ? (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={<User />} label="Username" value={trainer.username} color="blue" />
                            <StatCard icon={<Star />} label="Level" value={trainer.level} color="yellow" />
                            <StatCard icon={<Zap />} label="Total XP" value={trainer.xp} color="purple" />
                            <StatCard icon={<TrendingUp />} label="Streak" value={trainer.streak} color="green" />
                            <StatCard icon={<Award />} label="Badges" value={dashboardData?.achievements.badges || 0} color="orange" />
                            <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                                <button
                                    onClick={onViewLeaderboard}
                                    className="flex items-center w-full justify-center px-4 py-3 bg-purple-600 text-white font-black rounded-xl shadow-xl shadow-purple-500/30
                                             hover:bg-purple-700 transition duration-300 transform hover:scale-[1.02] ring-2 ring-pink-400/50"
                                >
                                    <Trophy className="w-5 h-5 mr-2 text-yellow-300" /> Kalos Rankings
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Loading trainer data...</p>
                    )}
                </div>

                <div className="lg:col-span-1 p-6 bg-blue-900/50 border-4 border-cyan-500 rounded-xl shadow-2xl shadow-cyan-500/20 flex flex-col items-center text-center">
                    <h2 className="text-xl font-extrabold text-cyan-300 mb-4">
                        {pokemon?.name || 'Loading...'}
                    </h2>

                    <div className="w-24 h-24 mb-4 border-4 border-cyan-500 shadow-xl rounded-full overflow-hidden flex items-center justify-center bg-slate-700">
                        <img
                            src={pokemonImageUrl}
                            alt={`${pokemon?.name} evolution stage`}
                            className="w-full h-full object-cover animate-pulse-slow transform scale-[1.8]"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/999999/white?text=Error'; }}
                        />
                    </div>

                    <p className="text-sm font-semibold text-gray-300">{pokemon?.evolution_status || 'Checking Status...'}</p>

                    <div className="w-full mt-4">
                        <p className="text-xs font-bold text-cyan-300 mb-1 flex justify-between">
                            <span>XP Progress</span>
                            <span>{pokemon?.xp_stat || '0/300'}</span>
                        </p>
                        <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner">
                            <div
                                className="h-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/30"
                                style={{ width: `${xp_percent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* POMODORO BAR */}
                    <div className="w-full mt-6 p-3 bg-slate-700 rounded-xl shadow-inner border border-slate-600">
                        <p className="text-xs font-black text-gray-400 mb-1 flex justify-between">
                            <span>TRAINING ENERGY</span>
                            <span className="text-sm font-extrabold text-white">{fatigueBarPercent.toFixed(0)}%</span>
                        </p>
                        <div className="w-full bg-slate-600 rounded-full h-4 shadow-md overflow-hidden">
                            <div
                                className={`h-4 ${fatigueBarColor} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${fatigueBarPercent}%` }}
                            ></div>
                        </div>
                        <p className={`text-xs mt-2 font-bold ${pomodoroStatus === 'breaking' ? 'text-cyan-400' : 'text-emerald-400'}`}>{fatigueBarText}</p>
                    </div>
                </div>

            </div>

            {/* Battle Activation and Weakness Report */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-4 border-l-4 border-purple-500 bg-purple-900/40 rounded-r-xl shadow-inner">
                    <h3 className="text-lg font-bold text-pink-400 mb-2">Weakness Report (Mega Evolve Your Skills)</h3>
                    {dashboardData?.last_weak_topics.length > 0 ? (
                        <p className="text-sm text-gray-300 font-medium flex flex-wrap items-center">
                            Target Areas:
                            {dashboardData.last_weak_topics.map(topic => (
                                <span key={topic} className="ml-2 px-3 py-1 bg-red-600/70 text-white text-xs font-extrabold rounded-full shadow-md animate-bounce-slow">
                                    {topic}
                                </span>
                            ))}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-300">No recent weakness data. Excellent work, Trainer! Try a fresh subject!</p>
                    )}
                </div>

                <div className="md:col-span-1 flex flex-col justify-center">
                    <button
                        onClick={handlePomodoroToggle}
                        disabled={buttonDisabled}
                        className={`flex items-center justify-center w-full px-4 py-4 font-black rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.05]
                            ${buttonDisabled
                                ? (pomodoroStatus === 'breaking' ? 'bg-cyan-900/70 text-cyan-400 cursor-not-allowed' : 'bg-gray-700 text-gray-400 cursor-not-allowed')
                                : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 ring-4 ring-pink-400/50'
                            }`}
                    >
                        {pomodoroStatus === 'breaking' ? <Heart className="w-5 h-5 mr-2 animate-pulse" /> : <Zap className="w-5 h-5 mr-2 text-yellow-300" />}
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface QuizSubjectSelectionProps {
    onStartQuiz: (subject: string) => void;
    dashboardData: DashboardData | null;
    pomodoroStatus: 'resting' | 'active' | 'breaking';
    pomodoroTimeLeft: number;
}
const QuizSubjectSelectionScreen: React.FC<QuizSubjectSelectionProps> = ({ onStartQuiz, dashboardData, pomodoroStatus, pomodoroTimeLeft }) => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const weakTopics = dashboardData?.last_weak_topics || [];

    const isBreakTime = pomodoroStatus === 'breaking';
    const isResting = pomodoroStatus === 'resting';

    const timerMins = Math.floor(pomodoroTimeLeft / 60);
    const timerSecs = pomodoroTimeLeft % 60;
    const timeDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

    const isOnePieceTheme = useAuth().theme === 'one_piece';

    const themeColors = isOnePieceTheme
        ? { primary: 'text-yellow-500', secondary: 'border-red-600', bg: 'bg-red-800', hover: 'hover:bg-red-700' }
        : { primary: 'text-white', secondary: 'border-purple-500', bg: 'bg-blue-700', hover: 'hover:bg-blue-600' };

    return (
        <div className="p-6 md:p-10 bg-slate-900/90 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-cyan-500/70 backdrop-blur-md">
            <h2 className={`text-3xl font-extrabold ${isOnePieceTheme ? themeColors.primary : 'text-white'} mb-6 border-b-2 ${themeColors.secondary} pb-4 drop-shadow-md`}>
                {isOnePieceTheme ? 'Select Your Sea (Subject)' : 'Choose Your Battle Arena'}
            </h2>

            <p className="text-gray-300 mb-10 font-medium text-lg">
                Select a research topic. You must be in an **Active Training Session** (Pomodoro Mode) to begin!
            </p>

            {isBreakTime && (
                <div className="p-4 mb-8 bg-blue-900/70 border-4 border-cyan-500 rounded-xl text-center shadow-lg animate-pulse-slow">
                    <p className="text-2xl font-black text-cyan-400 flex items-center justify-center">
                        <Heart className="w-6 h-6 mr-3 text-red-500 fill-red-500" />
                        POKÉMON RESTING!
                    </p>
                    <p className="text-lg font-bold text-gray-300 mt-2">
                        Wait for your break to end ({timeDisplay}) before starting a new battle.
                    </p>
                </div>
            )}

            {isResting && (
                <div className="p-4 mb-8 bg-purple-900/70 border-4 border-purple-500 rounded-xl text-center shadow-lg animate-pulse">
                    <p className="text-2xl font-black text-yellow-400 flex items-center justify-center">
                        <Zap className="w-6 h-6 mr-3 text-yellow-400 fill-yellow-400" />
                        ENERGY REQUIRED!
                    </p>
                    <p className="text-lg font-bold text-gray-300 mt-2">
                        Go to the Dashboard and click **Start Pomodoro Mode** to begin your training session.
                    </p>
                </div>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${isBreakTime || isResting ? 'opacity-30 pointer-events-none' : ''}`}>
                {subjects.map(subject => {
                    const isWeak = weakTopics.includes(subject);

                    return (
                        <button
                            key={subject}
                            onClick={() => onStartQuiz(subject)}
                            disabled={isBreakTime || isResting}
                            className={`flex flex-col items-center justify-center p-4 ${themeColors.bg} text-white font-bold rounded-xl shadow-xl shadow-blue-500/20
                                         ${themeColors.hover} transition duration-300 transform hover:scale-[1.05] text-center text-lg ring-2 ring-cyan-500/50 relative`}
                        >
                            <MonitorPlay className={`w-6 h-6 mb-2 ${isOnePieceTheme ? themeColors.primary : 'text-cyan-300'}`} />
                            {subject} {isOnePieceTheme ? 'Sea' : ''}
                            {isWeak && <Zap className="w-4 h-4 text-red-400 fill-red-400 absolute top-1 right-1 animate-bounce" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


interface FeedbackProps {
    weakTopics: string[];
    trainerUsername: string;
    pokemonName: string;
}

const FeedbackScreen: React.FC<FeedbackProps> = ({ weakTopics, trainerUsername, pokemonName }) => {
    const { theme } = useAuth();
    const isOnePieceTheme = theme === 'one_piece';
    const reportTitle = isOnePieceTheme ? "Shanks' Mentor Report" : "Professor Sycamore's Study Report";
    const analyzingText = isOnePieceTheme ? `Analyzing ${trainerUsername}'s Logbook data...` : `Analyzing **${trainerUsername}**'s battle data from Kalos...`;
    const preparingText = isOnePieceTheme ? 'Shanks is charting your next course!' : 'Professor Sycamore is preparing your strategic advice!';

    const [feedback, setFeedback] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const isTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const handleSpeak = useCallback((text: string) => {
        if (!isTtsSupported) {
            console.error("Your browser does not fully support Text-to-Speech.");
            return;
        }

        const synth = window.speechSynthesis;
        synth.cancel(); 

        if (isSpeaking) {
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*(.*?)\*\*/g, '$1'));

        const voices = synth.getVoices();

        //  IMPROVED VOICE SELECTION FOR A NATURAL VOICE (Zira, Samantha, or high-quality Google)
        const naturalVoice = voices.find(v => v.name.includes('Zira') && v.lang.startsWith('en-US')) ||
            voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en-US')) ||
            voices.find(v => v.name.includes('Google US English') && v.name.includes('Female')) ||
            voices.find(v => v.lang.startsWith('en-US')) ||
            voices[0];


        if (naturalVoice) {
            utterance.voice = naturalVoice;
        }

        // Set rate to be more natural (1.0 is default, 1.05 is slightly faster/more engaging)
        utterance.rate = 1.34;
        // Set pitch to be neutral (1.0 is default)
        utterance.pitch = 0.8;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('Speech Synthesis Error:', event.error);
            setIsSpeaking(false);
        };

        synth.speak(utterance);
    }, [isSpeaking, isTtsSupported]);

    useEffect(() => {
        return () => {
            if (isTtsSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isTtsSupported]);


    const generateFeedback = useCallback(async (topics: string[], username: string, starterName: string) => {
        if (topics.length === 0) {
            let successMsg;
            if (isOnePieceTheme) {
                successMsg = `Congratulations, Captain **${username}**! You and your Nakama **${starterName}** showed incredible focus across the seas. No specific weaknesses were detected in your last mission. This dedication is how you find the One Piece!`;
            } else {
                successMsg = `Congratulations, Trainer **${username}**! You and your partner **${starterName}** showed incredible focus. No specific weaknesses were detected in your last study session. This level of mastery is how champions are made!`;
            }
            setFeedback(successMsg);
            return;
        }

        setLoading(true);
        setError(null);
        setFeedback('');

        try {

            await new Promise(resolve => setTimeout(resolve, 2000));


            const topicsList = topics.join(' and ');
            let mockResponse;

//             if (isOnePieceTheme) {
//                 mockResponse = `Captain **${username}**! Your Nakama **${starterName}** struggled with the tides in **${topicsList}**. We must fortify the ship! Here is your three-step plan to conquer the Grand Line: 
                
// 1.  **Haki Training:** Focus on retrieving core **${topics[0]}** knowledge from memory under pressure. This sharpens your Observation Haki!
// 2.  **Navigation Check:** Find a fellow pirate and try to explain the **${topics[1] || topics[0]}** concept to them without charts. If you can navigate it, you know it!
// 3.  **Feast & Rest:** Don't forget the feast! A well-fed pirate is a powerful pirate. You are closer to the title than you think! Kaaizoku ou ni, ore wa naru! (I will be the King of the Pirates!)`;
//             } else {
//                 mockResponse = `Trainer **${username}**! Your partner **${starterName}** encountered some unexpected hurdles in **${topicsList}**. Challenging these weak spots is vital! Here is your three-step plan to achieve mastery: 
                
// 1.  **Focused Drill:** Concentrate on retrieving core **${topics[0]}** formulas from memory *before* checking your notes. This strengthens foundational knowledge.
// 2.  **Socratic Review:** Find a friend or tutor and try to explain the **${topics[1] || topics[0]}** concept to them. If you can teach it, you know it!
// 3.  **Rest & Reflect:** Don't forget to take a quick break! A rested mind is a focused mind. You are closer to the champion's title than you think! Allez!`;
//             }

const primaryTopic = topics[0];
const secondaryTopic = topics[1] || topics[0];


if (isOnePieceTheme) {
    mockResponse = `**☠️ WANTED: THE GRAND LINE QUEST ☠️**\n\n` +
                   `**CAPTAIN:** **${username}**\n` +
                   `**TARGET (Nakama):** **${starterName}**\n` +
                   `**FAILURE POINT (Bounty Zone):** **${topicsList}**\n\n` +
                   `Captain, a minor challenge in this zone is holding us back. Your Nakama needs a tailored plan to defeat this challenge and raise their bounty!\n\n` +
                   `** QUEST LOG: THREE STEPS TO GOLD **\n\n` +
                   `1.  **Feast & Rest:**\n` +
                   `    * **Action:** Execute a full recall of the *core logic* of **${primaryTopic}** without any notes or assistance. This sharpens your senses for the next battle!\n` +
                   `2.  **SAIL MASTER: Charting the Course!**\n` +
                   `    * **Action:** Try to explain the **${secondaryTopic}** concept to a crewmate. If you can make them understand it, you've successfully charted the course.\n` +
                   `3.  **Feast & Rest:** Take a moment for a huge feast! A rested pirate is a powerful one. You are closer to the title than you think! **Kaaizoku ou ni, ore wa naru!** (I will be the King of the Pirates!)`;
} else {
    mockResponse = `** TRAINER REPORT: THE CHALLENGE AWAITS **\n\n` +
                   `**TRAINER:** **${username}**\n` +
                   `**PARTNER:** **${starterName}**\n` +
                   `**ARENA FLAWS (Topics):** **${topicsList}**\n\n` +
                   `Trainer, your partner encountered a challenging opponent in the arena. No weakness is permanent—it's just fuel for the next victory!\n\n` +
                   `** TRAINING PLAN: THREE STEPS TO MASTERY **\n\n` +
                   `1.  **Focused Drill: Foundational Strength**\n` +
                   `    *  Memorizing and instantly recalling the essential formulas/rules for **${primaryTopic}** *before* checking your notes. Speed is key!\n` +
                   `2.  **Socratic Review: Socratic Sparring**\n` +
                   `    *  Teach the **${secondaryTopic}** concept to a friend. If you can mentor them to victory, your mastery is complete.\n` +
                   `3.  **VICTORY LAP:** You've earned a short break! Mental focus wins the day. You are much closer to the champion's title than you realize! **Allez!** (Go!)`;
}


            setFeedback(mockResponse);

        } catch (err: any) {
            setError("The Mentor is currently unavailable. Please try again.");
        } finally {
            setLoading(false);
        }

    }, [isOnePieceTheme]);

    useEffect(() => {
        generateFeedback(weakTopics, trainerUsername, pokemonName);
    }, [weakTopics, trainerUsername, pokemonName, generateFeedback]);


    return (
        <div className={`p-6 md:p-10 ${isOnePieceTheme ? 'bg-gray-900/90 border-4 border-yellow-500/70' : 'bg-slate-900/90 border-4 border-purple-500/70'} rounded-2xl shadow-2xl w-full max-w-4xl mx-auto backdrop-blur-md`}>
            <div className={`flex justify-between items-center border-b-2 ${isOnePieceTheme ? 'border-red-600' : 'border-yellow-500'} pb-4 mb-6`}>
                <h2 className="text-3xl font-extrabold text-white flex items-center drop-shadow-md">
                    <MessageSquare className={`w-7 h-7 mr-3 ${isOnePieceTheme ? 'text-red-500 fill-red-500' : 'text-yellow-400 fill-yellow-400'}`} />
                    {reportTitle}
                </h2>

                {/* TTS Button */}
                <button
                    onClick={() => handleSpeak(feedback)}
                    disabled={!feedback || loading || error}
                    className={`p-3 rounded-full shadow-lg transition-all duration-300
                        ${isSpeaking ?
                            'bg-red-600 text-white animate-pulse' :
                            'bg-cyan-500 text-white hover:bg-cyan-600'}
                        ${(!feedback || loading || error) && 'opacity-50 cursor-not-allowed'}
                    `}
                >
                    {isSpeaking ? <X className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5" />}
                </button>
            </div>

            <div className={`p-6 ${isOnePieceTheme ? 'bg-red-900/50 border-4 border-red-600' : 'bg-purple-900/50 border-4 border-purple-500'} rounded-xl shadow-lg min-h-64 flex flex-col justify-center`}>
                {loading && (
                    <div className="text-center p-8">
                        <Loader2 className={`w-10 h-10 animate-spin ${isOnePieceTheme ? 'text-yellow-500' : 'text-purple-400'} mb-4 mx-auto`} />
                        <p className="text-xl font-bold text-gray-300">{analyzingText}</p>
                        <p className="text-sm text-gray-400 mt-1">{preparingText}</p>
                    </div>
                )}

                {error && (
                    <div className="text-center p-8 bg-rose-900/50 border border-rose-600 rounded-lg">
                        <p className="text-rose-300 font-bold">{error}</p>
                    </div>
                )}

                {feedback && (
                    <div className="text-gray-200 text-lg font-medium leading-relaxed">
                        <p className={`font-bold ${isOnePieceTheme ? 'text-yellow-400' : 'text-cyan-400'} mb-3`}>Report on Weak Topics: {weakTopics.length > 0 ? weakTopics.join(', ') : 'None!'}</p>
                        <p dangerouslySetInnerHTML={{ __html: feedback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                    </div>
                )}

                {!loading && !error && !feedback && (
                    <div className="text-center p-8">
                        <p className="text-xl font-bold text-gray-400">No recent quiz data found for specific feedback.</p>
                    </div>
                )}
            </div>

            <p className="mt-6 text-sm text-gray-500 italic">
                {isTtsSupported ? "*Click the play icon to hear the report." : "*Text-to-Speech not fully supported in this browser."}
            </p>
        </div>
    );
};


// Leaderboard Screen 
const LeaderboardScreen: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const MOCK_LEADERBOARD_DATA: LeaderboardEntry[] = useMemo(() => ([
        { username: 'TrainerRed', xp: 5800, level: 12, pokemon_name: 'Charizard' },
        { username: 'StudyMaster', xp: 4500, level: 10, pokemon_name: 'Blastoise' },
        { username: 'CodeNinja', xp: 3900, level: 9, pokemon_name: 'Venusaur' },
        { username: 'ReactDev', xp: 3100, level: 8, pokemon_name: 'Pikachu' },
        { username: 'WebWarrior', xp: 2500, level: 7, pokemon_name: 'Snorlax' },
        { username: 'Newbie', xp: 1250, level: 5, pokemon_name: 'Bulbasaur' },
    ]), []);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const maxRetries = 3;
            let response = null;
            let data = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/leaderboard');
                    data = await response.json();

                    if (response.ok) {
                        break;
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || 'Failed to fetch leaderboard data after multiple retries.');
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
            setLeaderboard(data || MOCK_LEADERBOARD_DATA);

        } catch (err: any) {
            console.error("Leaderboard Fetch Error:", err);
            setError(err.message || "An unknown error occurred while fetching the leaderboard. Using mock data.");
            setLeaderboard(MOCK_LEADERBOARD_DATA);
        } finally {
            setLoading(false);
        }
    }, [MOCK_LEADERBOARD_DATA]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-cyan-500">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                <p className="text-white font-black text-xl">Fetching Kalos League Standings...</p>
            </div>
        );
    }

    if (error && leaderboard.length === 0) {
        return (
            <div className="p-10 bg-rose-900/50 border border-rose-500 rounded-xl shadow-2xl w-full max-w-4xl mx-auto text-rose-300">
                <h3 className="text-xl font-bold text-rose-400 mb-3">Leaderboard Error</h3>
                <p className="text-rose-300">{error}</p>
            </div>
        );
    }

    const getMedal = (rank: number) => {
        if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-pulse" />;
        if (rank === 2) return <Trophy className="w-7 h-7 text-gray-300 fill-gray-300 drop-shadow-lg" />;
        if (rank === 3) return <Trophy className="w-6 h-6 text-amber-500 fill-amber-500 drop-shadow-lg" />;
        return <span className="w-6 h-6 text-gray-400 font-black text-lg">{rank}</span>;
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-slate-800/95 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.5)] border-4 border-blue-600 backdrop-blur-sm">
            <h2 className="text-4xl font-black text-white mb-8 flex items-center justify-center border-b-4 border-cyan-400 pb-4 drop-shadow-md">
                <Trophy className="w-9 h-9 mr-4 text-yellow-400 fill-yellow-400 drop-shadow-xl" />
                Kalos Champion Ranking
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-xl shadow-black/50">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-blue-900/70 text-cyan-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tl-xl">Rank</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Trainer</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Level</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total XP</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tr-xl">Partner</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700 text-gray-200">
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 text-center">
                                    No trainers found on the leaderboard. Be the first!
                                </td>
                            </tr>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <tr key={entry.username} className={index % 2 === 0 ? 'bg-slate-700/50 hover:bg-slate-700 transition' : 'bg-slate-800 hover:bg-slate-700 transition'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-white flex items-center space-x-2">
                                        {getMedal(index + 1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-cyan-400">{entry.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-bold">{entry.level}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-emerald-400 font-black">{entry.xp.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-bold">{entry.pokemon_name}</td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


interface LoginScreenProps {
    onLoginSuccess: (token: string, userId: string, theme: AppTheme) => void;
}

const StarterPokemonCard: React.FC<{ name: string, selected: boolean, onClick: (name: string) => void }> = ({ name, selected, onClick }) => {
    const imageUrl = getPokemonImageUrl(name);
    const baseClasses = "flex flex-col items-center p-3 rounded-xl transition-all duration-200 cursor-pointer border-2 ";
    const selectedClasses = "border-yellow-400 bg-yellow-500/20 shadow-xl shadow-yellow-500/30 ring-4 ring-yellow-400";
    const defaultClasses = "border-gray-600 bg-slate-700/50 hover:border-yellow-300";

    return (
        <div
            className={baseClasses + (selected ? selectedClasses : defaultClasses)}
            onClick={() => onClick(name)}
        >
            <img
                src={imageUrl}
                alt={name}
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64/999999/white?text=?'; }}
            />
            <p className="mt-2 text-sm font-bold text-white">{name}</p>
        </div>
    );
};


const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [themeName, setThemeName] = useState<AppTheme>('pokemon_kalos');
    const [pokemonName, setPokemonName] = useState('Pikachu'); 
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const starterOptions = ['Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle'];

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const endpoint = isRegisterMode ? 'register' : 'login';

        try {
            const body = isRegisterMode
                ? {
                    username,
                    password,
                    // Only send pokemon_name if the theme is pokemon_kalos
                    pokemon_name: themeName === 'pokemon_kalos' ? pokemonName : 'Turtwig',
                    theme: themeName
                }
                : {
                    username,
                    password,
                    theme: themeName
                };

            const maxRetries = 3;
            let response = null;
            let data = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                    data = await response.json();

                    if (response.ok && !data.error) {
                        break;
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || `${endpoint} failed after multiple retries.`);
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }


            if (isRegisterMode) {
                setSuccessMessage(`Registration successful! Your journey theme is ${themeName}. Please log in.`);
                setIsRegisterMode(false);
            } else {
                const loggedInTheme: AppTheme = themeName;
                onLoginSuccess(data.auth_token, data.user_id, loggedInTheme);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-cover bg-center p-4" style={{ backgroundImage: "url('/images/bg_login.jpeg')" }}>
            {/* Pikachu */}
            <img
                src="/images/pikachu .png"
                alt="Pikachu"
                className="absolute w-64 h-64 sm:w-80 sm:h-78 left-[23%] top-[47%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
            />

            {/* Bulbasaur */}
            <img
                src="/images/bulbasaur.png"
                alt="Bulbasaur"
                className="absolute w-48 h-48 sm:w-80 sm:h-75 top-[2%] left-[37%] transform -translate-x-1/2 z-0 opacity-100 mix-blend-normal"
            />

            {/* Charmander */}
            <img
                src="/images/charmandar.png"
                alt="Charmander"
                className="absolute w-56 h-56 sm:w-80 sm:h-75 top-[30%] right-[27%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
            />

            {/* Squirtle */}
            <img
                src="/images/squirtle.png"
                alt="Squirtle"
                className="absolute w-56 h-56 sm:w-88 sm:h-90 bottom-[25%] right-[20%] transform z-0 opacity-100 mix-blend-normal"
            />



            <div className="w-full max-w-sm p-8 rounded-2xl relative z-10
             bg-black/40 backdrop-blur-xl
             border border-[#00FFD1]/10
             shadow-[0_0_30px_rgba(0,255,209,0.4)]
             ring-2 ring-[#00FFD1]/40
             flex flex-col items-center">
                <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                    Trainer {isRegisterMode ? 'Registration' : 'Login'}
                </h2>

                {successMessage && (
                    <div className="p-3 mb-4 bg-green-600/80 text-white rounded-lg font-medium w-full text-center">
                        {successMessage}
                    </div>
                )}
                <div className="mb-5 w-full">
                    <label className="block text-lg font-semibold text-gray-400 mb-1">
                        Select Theme
                    </label>
                    <select
                        value={themeName}
                        onChange={(e) => {
                            setThemeName(e.target.value as AppTheme);
                            if (isRegisterMode && e.target.value !== 'pokemon_kalos') {
                                setPokemonName('Turtwig'); 
                            } else if (isRegisterMode && e.target.value === 'pokemon_kalos') {
                                setPokemonName('Pikachu');
                            }
                        }}
                        disabled={isRegisterMode && themeName === 'one_piece'} 
                        className="w-full h-14 p-3 border-none bg-[#151C20] text-white rounded-xl focus:ring-2 focus:ring-[#00FFD1] shadow-inner shadow-gray-700/50"
                    >
                        <option value="pokemon_kalos">Pokémon (Kalos Quest)</option>
                        <option value="one_piece">One Piece (The Grand Line)</option>
                        <option value="default" disabled>Default (Coming Soon)</option>
                    </select>
                </div>

                <div className="mb-5 w-full">
                    <label htmlFor="username-input" className="block text-lg font-semibold text-gray-400 mb-1">
                        Username
                    </label>
                    <input
                        id="username-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-14 w-full text-base px-5 pr-12
                                     border-none rounded-xl
                                     focus:ring-2 focus:ring-[#00FFD1]
                                     bg-[#151C20] text-white placeholder-gray-500
                                     shadow-inner shadow-gray-700/50 transition-colors"
                    />
                </div>

                {/* Password */}
                <div className="mb-6 w-full">
                    <label htmlFor="password-input" className="block text-lg font-semibold text-gray-400 mb-1">
                        Password
                    </label>
                    <input
                        id="password-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 w-full text-base px-5 pr-12
                                     border-none rounded-xl
                                     focus:ring-2 focus:ring-[#00FFD1]
                                     bg-[#151C20] text-white placeholder-gray-500
                                     shadow-inner shadow-gray-700/50 transition-colors"
                    />
                </div>
                {isRegisterMode && themeName === 'pokemon_kalos' && (
                    <div className="mb-6 w-full">
                        <label className="block text-lg font-semibold text-gray-400 mb-2">
                            Choose Your Partner Pokémon
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {starterOptions.map(starter => (
                                <StarterPokemonCard
                                    key={starter}
                                    name={starter}
                                    selected={pokemonName === starter}
                                    onClick={setPokemonName}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 mb-4 bg-red-700/80 text-white rounded-lg font-medium w-full text-center">
                        {error}
                    </div>
                )}

                {/* Login/Register Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !username || !password || (isRegisterMode && themeName === 'pokemon_kalos' && !pokemonName)}
                    className="w-full py-3 mt-2 font-extrabold rounded-lg shadow-lg transition-all duration-300
                                 bg-gradient-to-t from-orange-500 to-yellow-400
                                 hover:from-orange-600 hover:to-yellow-300
                                 text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 inline animate-spin text-black" />
                    ) : (
                        isRegisterMode ? `Register & Start ${themeName.split('_').pop()}` : 'Login'
                    )}
                </button>

                {/* Switch mode link */}
                <p className="mt-6 text-center text-sm text-gray-300">
                    {isRegisterMode ? 'Already have an account?' : "Don’t have an account?"}
                    <button
                        onClick={() => {
                            setIsRegisterMode(!isRegisterMode);
                            setError('');
                            setSuccessMessage('');
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold ml-2 transition"
                    >
                        {isRegisterMode ? 'Login here' : 'Register here'}
                    </button>
                </p>
            </div>
        </div>
    );
};

const WelcomeScreen: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
    const pokemonName = "Pikachu";
    return (

        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="z-10 max-w-7xl w-full flex flex-col md:flex-row items-center justify-between lg:gap-16">
                <div className="text-left space-y-6 md:w-1/2 p-4">
                    <h1 className="text-6xl font-extrabold leading-tight">
                        Begin Your Adventure!
                    </h1>
                    <p className="text-xl text-gray-300">
                        Immerse yourself in the captivating world of Pokémon. Choose your starter, witness its hatch, and embark on a personalized learning experience that will elevate your knowledge and skills. Unlock the secrets of these beloved creatures
                    </p>

                    <div className="pt-6 space-y-4">

                        <button
                            onClick={onGoToLogin}
                            className="flex items-center justify-center px-10 py-4 w-64 bg-[#FFEA00] text-black font-extrabold text-lg rounded-xl shadow-xl shadow-yellow-500/50
                                             transition duration-200 transform hover:scale-[1.03] ring-2 ring-[#FFEA00]"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Let's Begin!
                        </button>
                    </div>
                </div>

                <div className="md:w-1/2 flex justify-center p-4 overflow-visible relative">
                    <img
                        src='/images/pikachu_landing_03.png'
                        alt="3D Pokémon Starter Scene"

                        className="w-[180%] max-w-none md:w-[130%] lg:w-[150%] xl:w-[180%] 2xl:w-[200%]
                                             drop-shadow-[0_0_40px_rgba(255,234,0,0.7)]
                                             translate-x-[15%] md:translate-x-[25%] lg:translate-x-[30%] xl:translate-x-[20%]
                                             -translate-y-[10%] md:-translate-y-[5%]" // Slightly lift to center vertically
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/400x400/101010/FFEA00?text=3D+Scene'; }}
                    />
                </div>
            </div>
        </div>


    );
};


const FeatureRow: React.FC = () => {
    const features = [
        {
            name: "Pikachu",
            image: "/images/pikachu_starter.png", 
            color: "bg-yellow-500", 
            description: "The iconic \"Electric Pokémon.\" Choosing Pikachu channels boundless energy and lightning-fast critical thinking. It is the perfect partner for trainers seeking electric efficiency and impactful, dynamic solutions."
        },
        {
            name: "Bulbasaur",
            image: "/images/bulbasaur_starter.png",
            color: "bg-[#2563EB]",
            description: "The original \"Bulb Pokémon.\" Choosing Bulbasaur means embracing the power of balanced learning and strategic growth. It's the steadfast companion for trainers who value a solid foundation, ready to bloom into comprehensive expertise."
        },
        {
            name: "Squirtle",
            image: "/images/squirtle_starter.png",
            color: "bg-[#10B981]",
            description: "The original \"Tiny Turtle Pokémon.\" Squirtle is the perfect choice for trainers focused on analytical thinking and precise execution. Choose Squirtle to master the art of controlled research and emerge victorious through pure reason."
        },
        {
            name: "Charmander",
            image: "/images/charmander_starter.png",
            color: "bg-[#F59E0B]",
            description: "The original \"Lizard Pokémon.\" Choosing Charmander ignites your journey with passion and speed. Its tail flame reflects your unquenchable thirst for knowledge, mirroring your own limitless academic ambition."
        },
    ];

    return (
        <section className="py-20 bg-black text-white px-4">
            <div className="max-w-6xl mx-auto text-center">

                {/* Headers */}
                <p className="text-yellow-400 font-semibold mb-2 text-3xl">Discover the Wonders of Pokémon</p>
                <h3 className="text-6xl font-extrabold mb-6">Explore the Pokémon World</h3>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-12">
                    Join us on a captivating Pokémon journey where you'll choose a starter Pokémon, watch it hatch from an egg,
                    and train to become a master.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => {
                        let titleClasses = "text-2xl font-bold mb-2 ";

                        if (feature.name === 'Pikachu') {
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500';
                        } else if (feature.name === 'Bulbasaur') {
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-600';
                        } else if (feature.name === 'Squirtle') {
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-600';
                        } else if (feature.name === 'Charmander') {
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600';
                        } else {
                            titleClasses += 'text-white';
                        }

                        return (
                            <div
                                key={feature.name}
                                className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl transition transform hover:scale-[1.03] duration-300 border border-gray-700 hover:border-yellow-400"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className={`w-40 h-40 flex items-center justify-center rounded-full p-2 ${feature.color} shadow-inner shadow-black/20 overflow-hidden`}>
                                        <img
                                            src={feature.image}
                                            alt={feature.name}
                                            className="w-full h-full object-cover drop-shadow-lg scale-175 transform -translate-y-2"
                                            onError={(e) => { e.currentTarget.src = `https://placehold.co/160x160/${feature.color.replace('bg-[#', '').replace(']', '')}/white?text=${feature.name}`; }}
                                        />
                                    </div>
                                </div>
                                <h4 className={titleClasses}>
                                    {feature.name}
                                </h4>

                                <p className="text-gray-400 text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

const LandingScreen: React.FC<{ onStartJourney: () => void }> = ({ onStartJourney }) => {
    return (
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden font-inter">
            <nav className="relative z-20 w-full p-6 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-3xl font-bold">
                    <Egg className="w-7 h-7 text-yellow-300 fill-yellow-300" />
                    <span className="text-yellow-300">Poke</span><span className="text-white">Quest</span>
                </div>
                <div className="hidden sm:flex items-center space-x-6">
                    <button onClick={onStartJourney} className="px-5 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition shadow-xl">
                        Start Journey
                    </button>
                </div>
                <button onClick={onStartJourney} className="sm:hidden px-3 py-1 bg-red-500 text-white font-bold rounded-full">
                    Login
                </button>
            </nav>
            <header className="flex flex-col md:flex-row relative overflow-hidden min-h-[calc(100vh-80px)] bg-black">
                <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                    <img
                        src='/images/hero_pikachu.png'
                        alt="A stylized illustration of Pikachu welcoming users."
                        className="object-contain w-full h-full md:w-[60vw] md:h-full lg:w-[50vw] xl:w-[45vw]
                                             md:absolute md:right-0 md:bottom-0 md:translate-x-[15%] md:translate-y-[15%]
                                             lg:translate-x-[10%] lg:translate-y-[10%] xl:translate-x-[0%] xl:translate-y-[10%]
                                             mix-blend-lighten opacity-30 sm:opacity-90"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/800x800/000000/F5D04C?text=Pikachu+Placeholder'; }}
                    />
                </div>
                <div className="relative z-10 flex flex-col justify-center items-center md:items-start w-full md:w-1/2 mr-auto p-8 lg:p-16 text-center md:text-left">
                    <h2 className="text-6xl lg:text-7xl font-black text-white leading-tight mb-4 tracking-tighter drop-shadow-lg">
                        Train Smarter, <br className="hidden md:inline" /> Become a Master.
                    </h2>
                    <p className="text-lg text-gray-300 mb-10 max-w-lg mx-auto md:mx-0">
                        Welcome to PokeQuest! Every lesson is a new challenge. Choose your research topic, hatch a brilliant insight, and begin your quest to discover your potential and become an expert trainer.
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center md:justify-start">
                        <button
                            onClick={onStartJourney}
                            className="flex items-center justify-center bg-yellow-300 text-white font-bold py-4 px-8 rounded-xl shadow-2xl
                                             hover:bg-yellow-300 transition duration-300 text-lg transform hover:scale-[1.05] ring-2 ring-red-300/50"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Start Your Quest
                        </button>

                        <a href="#features" className="flex items-center justify-center border-2 border-gray-500 text-gray-300 font-bold py-4 px-8 rounded-xl
                                             hover:border-yellow-300 hover:text-yellow-300 transition duration-300 text-lg">
                            <BookOpen className="w-5 h-5 mr-2" /> Explore Features
                        </a>
                    </div>
                </div>
            </header>
            <div id="features" className="bg-gray-900">
                <FeatureRow />
                <WelcomeScreen onGoToLogin={onStartJourney} />
            </div>
        </div>
    );
};

const notes_and_lists = {
    get_notes_and_lists: async ({ search_term, hint }: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (search_term === 'My Grand Line Study List') {
             return {
                notes_and_lists_items: [
                    {
                        list_content: {
                            list_items: [
                                { text_content: "Review Grand Line Map (Kinematics)", checked: false, list_item_id: "1665488100001" },
                                { text_content: "Practice Haki (Math Integrals)", checked: false, list_item_id: "1665488100002" },
                                { text_content: "Raid a Marine Base (Ecology)", checked: true, list_item_id: "1665488100003" },
                            ]
                        }
                    }
                ]
            };
        }
        if (search_term === 'My Pokémon Study List') {
            return {
                notes_and_lists_items: [
                    {
                        list_content: {
                            list_items: [
                                { text_content: "Review Physics Kinematics", checked: false, list_item_id: "1665488200001" },
                                { text_content: "Practice Math Integrals", checked: false, list_item_id: "1665488200002" },
                                { text_content: "Read Chapter 4 Bio", checked: true, list_item_id: "1665488200003" },
                            ]
                        }
                    }
                ]
            };
        }
        return { notes_and_lists_items: [] };
    },
    create_list: async ({ list_name, elements_to_add }: any) => { await new Promise(resolve => setTimeout(resolve, 500)); return {}; },
    add_to_list: async () => { await new Promise(resolve => setTimeout(resolve, 100)); },
    update_list_item: async () => { await new Promise(resolve => setTimeout(resolve, 100)); },
    delete_list_item: async () => { await new Promise(resolve => setTimeout(resolve, 100)); },
};


const TodoListScreen = () => {
    const { theme } = useAuth();
    const isOnePieceTheme = theme === 'one_piece';
    const initialListName = isOnePieceTheme ? 'Grand Line Mission Log' : 'My Pokémon Study List';
    const styles = getThemeStyles(theme);

    interface ListItem {
        text_content: string;
        checked: boolean;
        list_item_id: string;
    }

    const [task, setTask] = useState('');
    const [listName, setListName] = useState(initialListName);
    const [isLoading, setIsLoading] = useState(false);
    const [currentList, setCurrentList] = useState<ListItem[] | null>(null); 
    const [message, setMessage] = useState('');


    const createOrGetList = useCallback(async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const result = await notes_and_lists.get_notes_and_lists({ search_term: initialListName, hint: 'LIST' });
            if (result.notes_and_lists_items && result.notes_and_lists_items.length > 0) {
                setCurrentList(result.notes_and_lists_items[0].list_content.list_items as ListItem[]);
                setMessage(`${initialListName} loaded successfully.`);
                return;
            }

            await notes_and_lists.create_list({ 
                list_name: initialListName, 
                elements_to_add: isOnePieceTheme ? ["Review Grand Line Map (Kinematics)", "Practice Haki (Math Integrals)"] : ["Review Physics Kinematics", "Practice Math Integrals"] 
            });
            setCurrentList(isOnePieceTheme ? 
                [{ text_content: "Review Grand Line Map (Kinematics)", checked: false, list_item_id: "init1" }, { text_content: "Practice Haki (Math Integrals)", checked: false, list_item_id: "init2" }] :
                [{ text_content: "Review Physics Kinematics", checked: false, list_item_id: "init1" }, { text_content: "Practice Math Integrals", checked: false, list_item_id: "init2" }]
            );

            setMessage(`New list created: ${initialListName}`);

        } catch (error) {
            setMessage('Error accessing the list. Try again.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [initialListName, isOnePieceTheme]);

    const addTask = async () => {
        if (!task.trim() || isLoading) return; 
        setIsLoading(true);
        setMessage('');

        const newTaskText = task.trim();
        const newList = [...(currentList || []), { text_content: newTaskText, checked: false, list_item_id: Date.now().toString() }];
        await notes_and_lists.add_to_list({ search_term: listName, elements_to_add: [newTaskText], is_bulk_mutation: false });

        setCurrentList(newList);
        setTask('');
        setMessage(`Added task: "${newTaskText}"`);
        setIsLoading(false);
    };

    const toggleTask = (id: string) => {
        if (!currentList) return;
        const updatedList = currentList.map(item =>
            item.list_item_id === id ? { ...item, checked: !item.checked } : item
        );
        setCurrentList(updatedList);
    };

    const removeTask = (id: string) => {
        if (!currentList) return;
        const updatedList = currentList.filter(item => item.list_item_id !== id);
        setCurrentList(updatedList);
    };

    useEffect(() => {
        createOrGetList();
    }, [createOrGetList]);

    const completedTasks = currentList ? currentList.filter(item => item.checked) : [];
    const pendingTasks = currentList ? currentList.filter(item => !item.checked) : [];

    return (
        <div className={`p-6 md:p-10 ${styles.bg} rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 ${styles.border} backdrop-blur-md`}>
            <h1 className={`text-4xl font-extrabold text-white mb-6 border-b-4 ${styles.borderColor} pb-2 flex items-center`}>
                <List className={`w-8 h-8 mr-3 ${styles.accentColor}`} /> {listName}
            </h1>
            <p className="text-gray-300 mb-6 text-lg">
                {isOnePieceTheme ? 'Set sail with your crew\'s next mission objectives.' : 'Master your study tasks like a Pokémon Master!'}
            </p>

            {/* Task Input */}
            <div className="flex space-x-3 mb-8">
                <input
                    type="text"
                    placeholder={isOnePieceTheme ? "Enter a new bounty objective..." : "Enter a new study task (e.g., 'Read Chapter 4 Bio')"}
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    disabled={isLoading}
                    className={`flex-grow py-3 px-4 border-2 border-gray-600 rounded-xl focus:outline-none ${styles.inputFocus} transition shadow-md text-white bg-slate-700/80`}
                />
                <button
                    onClick={addTask}
                    disabled={isLoading || !task.trim()}
                    className={`flex items-center text-white font-bold py-3 px-6 rounded-xl transition shadow-lg disabled:opacity-50 ${styles.accentBg}`}
                >
                    <Plus className="w-5 h-5 mr-2" /> {isOnePieceTheme ? 'Add Objective' : 'Add Task'}
                </button>
            </div>
            {isLoading && (
                <p className={`flex items-center mb-4 ${styles.accentColor}`}>
                    <Clock className="w-4 h-4 mr-2 animate-spin" /> Loading list...
                </p>
            )}
            {message && <p className="text-sm text-gray-400 mb-4">{message}</p>}
            <div className="bg-slate-800/90 p-6 rounded-2xl shadow-inner border border-slate-700">
                <h2 className={`text-2xl font-bold mb-4 ${styles.accentColor}`}>{listName}</h2>

                <h3 className={`text-xl font-semibold text-gray-300 mb-3 border-b pb-1 border-slate-700`}>Pending ({pendingTasks.length})</h3>
                <ul className="space-y-3 mb-6">
                    {pendingTasks.map((item) => (
                        <li key={item.list_item_id} className={`flex items-center justify-between p-3 bg-slate-700/70 rounded-lg border-l-4 ${styles.listItemBorder} hover:shadow-md transition`}>
                            <span className="text-white flex-grow cursor-pointer" onClick={() => toggleTask(item.list_item_id)}>
                                {item.text_content}
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => toggleTask(item.list_item_id)}
                                    className="text-gray-400 hover:text-green-500 transition p-1"
                                    title="Mark as Complete"
                                >
                                    <CheckCircle className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => removeTask(item.list_item_id)}
                                    className="text-gray-400 hover:text-red-500 transition p-1"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {pendingTasks.length === 0 && <p className="text-gray-500 italic p-3">Nothing pending! Time for a rest!</p>}
                </ul>
                <h3 className="text-xl font-semibold text-gray-300 mb-3 border-b pb-1 border-slate-700">Completed ({completedTasks.length})</h3>
                <ul className="space-y-3 opacity-70">
                    {completedTasks.map((item) => (
                        <li key={item.list_item_id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border-l-4 border-green-500">
                            <span className="text-gray-500 line-through flex-grow cursor-pointer" onClick={() => toggleTask(item.list_item_id)}>
                                {item.text_content}
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => toggleTask(item.list_item_id)}
                                    className="text-green-500 hover:text-green-600 transition p-1"
                                    title="Mark as Pending"
                                >
                                    <CheckCircle className="w-6 h-6 fill-current" />
                                </button>
                                <button
                                    onClick={() => removeTask(item.list_item_id)}
                                    className="text-gray-400 hover:text-red-500 transition p-1"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
const SubjectData = [
    {
        name: "Physics",
        icon: Ruler,
        color: "text-blue-400",
        chapters: [
            {
                title: "Kinematics: 1D & 2D Motion",
                description: "Equations for projectile motion and displacement-time graphs.",
                link: "https://www.youtube.com/watch?v=hY9zZrYuDVk",
            },
            {
                title: "Newton's Laws & Dynamics",
                description: "Force, momentum, friction, and circular motion.",
                link: "https://www.youtube.com/watch?v=aPwqkZCBouU",
            },
            {
                title: "Work, Energy, and Power",
                description: "Conservation of energy and non-conservative forces.",
                link: "https://www.youtube.com/watch?v=M6R4bWT-eOU",
            },
            {
                title: "Oscillations",
                description: "Oscillations, springs, pendulums, and wave characteristics.",
                link: "http://youtube.com/watch?v=bv8qBsHK9bM",
            },
            {
                title: "Electromagnetism",
                description: "Electric fields, magnetic fields, and Faraday's Law.",
                link: "https://www.youtube.com/watch?v=_WXExQ4E-po",
            },
        ],
    },
    {
        name: "Chemistry",
        icon: FlaskRound,
        color: "text-green-400",
        chapters: [
            {
                title: "Atomic Structure & Periodicity",
                description: "Quantum numbers, electron configurations, and periodic trends.",
                link: "https://www.youtube.com/watch?v=Eu0jMAJje0A",
            },
            {
                title: "Chemical Bonding & Molecular Structure",
                description: "VSEPR theory, hybridization, and intermolecular forces.",
                link: "https://www.youtube.com/watch?v=BBsd2AdKUqw",
            },
            {
                title: "Stoichiometry & Moles",
                description: "Limiting reactants, percent yield, and concentration calculations.",
                link: "https://www.youtube.com/watch?v=jWmrcNrJ59E",
            },
            {
                title: "Chemical Equilibrium",
                description: "Reversible reactions, Le Chatelier's Principle, and reaction quotient.",
                link: "https://www.youtube.com/watch?v=ZUm2YPGqtAI",
            },
            {
                title: "Ionic Equilibrium",
                description: "Strong vs. weak acids/bases and buffer solutions.",
                link: "https://www.youtube.com/watch?v=IF7DGTWCK_c",
            },
        ],
    },
    {
        name: "Mathematics",
        icon: Calculator,
        color: "text-purple-400",
        chapters: [
            {
                title: "Differential Calculus",
                description: "Limits, derivatives, and applications (optimization, related rates).",
                link: "https://www.youtube.com/watch?v=YQ1Ix2FHlm0",
            },
            {
                title: "Integral Calculus",
                description: "Antiderivatives, definite integrals, and area under the curve.",
                link: "https://www.youtube.com/watch?v=PPCdmEDq85Y",
            },
            {
                title: "Trigonometry",
                description: "Identities, laws of sine/cosine, and complex numbers.",
                link: "https://www.youtube.com/watch?v=Q6YUTgL5MpI",
            },
            {
                title: "Vectors & 3D Geometry",
                description: "Dot products, cross products, and equation of a plane.",
                link: "https://www.youtube.com/watch?v=7v2vYv6Pl7g",
            },
            {
                title: "Probability & Statistics",
                description: "Bayes' Theorem, discrete/continuous distributions, and regression.",
                link: "https://www.youtube.com/watch?v=WOKchTFXnYo",
            },
        ],
    },
    {
        name: "Biology",
        icon: Dna,
        color: "text-red-400",
        chapters: [
            {
                title: "Cell Structure and Function",
                description: "Eukaryotic and prokaryotic organelles and membrane transport.",
                link: "https://www.youtube.com/watch?v=hJi3S1haN3Y",
            },
            {
                title: "Molecular Basis of Inheritance (Genetics)",
                description: "DNA structure, replication, transcription, and translation.",
                link: "https://www.youtube.com/watch?v=0S5jWfsPTQE",
            },
            {
                title: "Ecology and Environment",
                description: "Ecosystems, biogeochemical cycles, and biodiversity conservation.",
                link: "https://www.youtube.com/results?search_query=Ecology+and+Environment+biology+neet",
            },
            {
                title: "Human Physiology (Respiration & Circulation)",
                description: "Gas exchange mechanism and cardiac cycle.",
                link: "https://www.youtube.com/watch?v=bDhcqW8dYj8",
            },
            {
                title: "Plant Physiology (Photosynthesis)",
                description: "Light and dark reactions, C3 and C4 pathways.",
                link: "https://www.youtube.com/watch?v=d6pfq-0CwZc",
            },
        ],
    },

];

const allResources = SubjectData.flatMap(subject =>
    subject.chapters.map(chapter => ({
        ...chapter,
        subjectName: subject.name,
        subjectIcon: subject.icon,
        subjectColor: subject.color
    }))
);


const ResourceScreen = () => {
    const { theme } = useAuth();
    const isOnePieceTheme = theme === 'one_piece';
    const styles = getThemeStyles(theme);
    const [searchTerm, setSearchTerm] = useState('');


    const filteredResources = allResources.filter(resource => {
        const query = searchTerm.toLowerCase();
        return (
            resource.title.toLowerCase().includes(query) ||
            resource.description.toLowerCase().includes(query) ||
            resource.subjectName.toLowerCase().includes(query)
        );
    });

    const cardAccentColor = isOnePieceTheme ? 'border-yellow-500' : 'border-cyan-500';
    const headerIconColor = isOnePieceTheme ? 'text-yellow-500' : 'text-cyan-400';

    return (
        <div className={`p-6 md:p-10 ${styles.bg} rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 ${styles.border} backdrop-blur-md`}>
            <h1 className={`text-4xl font-extrabold text-white mb-6 border-b-4 ${styles.borderColor} pb-2 flex items-center`}>
                <BookOpen className={`w-8 h-8 mr-3 ${headerIconColor}`} /> {isOnePieceTheme ? 'Grand Line Maps' : 'Trainer Resources'} 📚
            </h1>
            <p className="text-gray-300 mb-6 text-lg">
                Access curated links and educational material for your toughest subjects.
            </p>

            <div className="relative mb-10">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by subject (e.g., 'Physics') or chapter title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-3 pl-10 pr-4 border-2 border-gray-600 rounded-xl focus:outline-none ${styles.inputFocus} transition shadow-md text-white bg-slate-700/80`}
                />
            </div>


            {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredResources.map((resource, index) => {
                        const IconComponent = resource.subjectIcon; 
                        return (
                            <a
                                key={index}
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block bg-slate-800/80 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] border-l-8 ${cardAccentColor}`}
                            >
                                <div className="flex items-start space-x-4">
                                    <IconComponent className={`w-8 h-8 ${resource.subjectColor} flex-shrink-0 mt-1`} />
                                    <div>
                                        <p className="text-sm font-semibold mb-1 uppercase text-gray-400">
                                            {resource.subjectName}
                                        </p>
                                        <h2 className="text-2xl font-bold text-white mb-1">
                                            {resource.title}
                                        </h2>
                                        <p className="text-gray-400 mb-3">
                                            {resource.description}
                                        </p>
                                        <span className={`inline-flex items-center text-sm font-semibold hover:text-red-400 transition ${isOnePieceTheme ? 'text-red-500' : 'text-blue-400'}`}>
                                            View Chapter <ExternalLink className="w-4 h-4 ml-2" />
                                        </span>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center p-12 bg-slate-800/80 rounded-2xl shadow-lg border border-slate-700">
                    <p className="text-2xl font-bold text-gray-300">No educational material found for "{searchTerm}" 😥</p>
                    <p className="text-gray-400 mt-2">Try searching by subject (e.g., "Math") or a topic!</p>
                </div>
            )}
        </div>
    );
};

interface MainLayoutProps {
    dashboardData: DashboardData | null;
    loadingDashboard: boolean;
    fetchDashboardData: () => void;
    logout: () => void;
}
const MainLayout: React.FC<MainLayoutProps> = ({ dashboardData, loadingDashboard, fetchDashboardData, logout }) => {
    const [currentScreen, setCurrentScreen] = useState<LoggedInScreen>('dashboard');
    const [currentSubject, setCurrentSubject] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [lastQuizWeakTopics, setLastQuizWeakTopics] = useState<string[]>([]);

    const [pomodoroStatus, setPomodoroStatus] = useState<'resting' | 'active' | 'breaking'>('resting');
    const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(POMODORO_WORK_DURATION);
    const [isPomodoroActive, setIsPomodoroActive] = useState(false);

    useEffect(() => {
        const isQuizScreen = currentScreen === 'quiz_select' || currentScreen === 'quiz_battle';
        const shouldTimerRun = isPomodoroActive && (isQuizScreen || pomodoroStatus === 'breaking');

        if (!shouldTimerRun) return;

        const timer = setInterval(() => {
            setPomodoroTimeLeft(prevTime => {
                if (prevTime > 0) {
                    return prevTime - 1;
                } else {
                    if (pomodoroStatus === 'active') {
                        setPomodoroStatus('breaking');
                        return POMODORO_BREAK_DURATION;
                    } else if (pomodoroStatus === 'breaking') {
                        setPomodoroStatus('resting');
                        setIsPomodoroActive(false);
                        return POMODORO_WORK_DURATION;
                    }
                    return 0;
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPomodoroActive, pomodoroStatus, currentScreen]);

    const handlePomodoroToggle = () => {
        if (pomodoroStatus === 'resting') {
            setPomodoroStatus('active');
            setPomodoroTimeLeft(POMODORO_WORK_DURATION);
            setIsPomodoroActive(true);
        }
    };

    const handleStartQuiz = (subject: string) => {
        if (pomodoroStatus !== 'active') {
            console.warn("Quiz access blocked: Not in an active Pomodoro session.");
            return;
        }

        setCurrentSubject(subject);
        setCurrentScreen('quiz_battle');
        setIsSidebarOpen(false);
    };

    const handleQuizComplete = (data: { score: number; weak_topics: string[] }) => {
        console.log("Quiz completed and results submitted. Updating dashboard stats.");
        setLastQuizWeakTopics(data.weak_topics);
        fetchDashboardData();
        setCurrentScreen('feedback');
    };

    const handleExitQuiz = () => {
        setCurrentScreen('quiz_select');
    };

    const navigate = (screen: LoggedInScreen) => {
        setCurrentScreen(screen);
        setIsSidebarOpen(false);
    }


    const navItems = [
        { name: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
        { name: 'Leaderboard', screen: 'leaderboard', icon: Trophy },
        { name: 'Start Quiz Battle', screen: 'quiz_select', icon: Zap },
        { name: 'Study Report', screen: 'feedback', icon: MessageSquare },
        { name: 'Resources', screen: 'resources', icon: BookOpen }, 
        { name: 'To-Do List', screen: 'todo_list', icon: List },    
    ];

    let screenContent;
    switch (currentScreen) {
        case 'dashboard':
            screenContent = loadingDashboard ? (
                <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-cyan-500">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                    <p className="text-white font-black text-xl">Loading Trainer Data...</p>
                </div>
            ) : (
                <Dashboard
                    onStartQuiz={handleStartQuiz}
                    dashboardData={dashboardData}
                    onViewLeaderboard={() => navigate('leaderboard')}
                    pomodoroStatus={pomodoroStatus}
                    pomodoroTimeLeft={pomodoroTimeLeft}
                    handlePomodoroToggle={handlePomodoroToggle}
                />
            );
            break;
        case 'leaderboard':
            screenContent = <LeaderboardScreen />;
            break;
        case 'quiz_select':
            screenContent = (
                <QuizSubjectSelectionScreen
                    onStartQuiz={handleStartQuiz}
                    dashboardData={dashboardData}
                    pomodoroStatus={pomodoroStatus}
                    pomodoroTimeLeft={pomodoroTimeLeft}
                />
            );
            break;
        case 'quiz_battle':
            screenContent = (
                <QuizBattle
                    subject={currentSubject}
                    onQuizComplete={handleQuizComplete}
                    onExit={handleExitQuiz}
                />
            );
            break;
        case 'feedback':
            screenContent = (
                <FeedbackScreen
                    weakTopics={lastQuizWeakTopics}
                    trainerUsername={dashboardData?.trainer_card.username || 'Trainer'}
                    pokemonName={dashboardData?.pokemon_panel.name || 'Pokémon'}
                />
            );
            break;
        case 'resources': 
            screenContent = <ResourceScreen />;
            break;
        case 'todo_list': 
            screenContent = <TodoListScreen />;
            break;
        default:
            screenContent = <p className="text-gray-900">Select a navigation link.</p>;
    }

    return (
        <div className="flex min-h-screen bg-slate-900 font-inter">
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                             lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out
                             w-72 bg-slate-800 shadow-xl border-r-4 border-blue-600 z-30 flex flex-col`}>

                <div className="p-6 flex items-center justify-between border-b border-slate-700 h-24">
                    <div className="flex items-center space-x-2 text-3xl font-black">
                        <Egg className="w-7 h-7 text-cyan-400 fill-cyan-400" />
                        <span className="text-cyan-400">Kalos</span><span className="text-white">Quest</span>
                    </div>
                    <button
                        className="lg:hidden text-gray-400 hover:text-cyan-400 p-2 rounded-full bg-slate-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-grow p-6 space-y-3">
                    {navItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.screen as LoggedInScreen)}
                            className={`flex items-center w-full px-5 py-3 rounded-lg font-bold transition-all duration-300
                                        ${currentScreen === item.screen || (item.screen === 'quiz_select' && currentScreen === 'quiz_battle')
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 transform scale-[1.02] border border-cyan-500'
                                            : 'text-gray-300 hover:bg-slate-700 hover:text-cyan-400'
                                        }`}
                        >
                            <item.icon className="w-6 h-6 mr-3" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-700">
                    <p className="text-base font-semibold text-gray-400 mb-1 truncate">
                        Trainer: {dashboardData?.trainer_card.username || 'Loading...'}
                    </p>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 mt-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
                    >
                        <XCircle className="w-5 h-5 mr-2" /> Log Out
                    </button>
                </div>
            </aside>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
                <header className="flex justify-between items-center lg:hidden sticky top-0 bg-slate-900/90 backdrop-blur-md z-20 py-4 mb-4 rounded-b-xl border-b border-cyan-500/50 shadow-md">
                    <div className="flex items-center space-x-2 text-2xl font-black">
                        <Egg className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                        <span className="text-cyan-400">Kalos</span><span className="text-white">Quest</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 transition"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>
                <div className="relative z-10">
                    {screenContent}
                </div>
            </div>
        </div>
    );
};

interface OnePieceMainLayoutProps {
    dashboardData: DashboardData | null;
    loadingDashboard: boolean;
    fetchDashboardData: () => void;
    logout: () => void;
}

const OnePieceMainLayout: React.FC<OnePieceMainLayoutProps> = ({ dashboardData, loadingDashboard, fetchDashboardData, logout }) => {
    const [currentScreen, setCurrentScreen] = useState<LoggedInScreen>('dashboard');
    const [currentSubject, setCurrentSubject] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [lastQuizWeakTopics, setLastQuizWeakTopics] = useState<string[]>([]);

    const username = dashboardData?.trainer_card.username || 'Straw Hat';
    const partnerName = dashboardData?.pokemon_panel.name || 'Nakama';


    const [pomodoroStatus, setPomodoroStatus] = useState<'resting' | 'active' | 'breaking'>('resting');
    const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(POMODORO_WORK_DURATION);
    const [isPomodoroActive, setIsPomodoroActive] = useState(false);


    useEffect(() => {
        const isQuizScreen = currentScreen === 'quiz_select' || currentScreen === 'quiz_battle';
        const shouldTimerRun = isPomodoroActive && (isQuizScreen || pomodoroStatus === 'breaking');

        if (!shouldTimerRun) return;

        const timer = setInterval(() => {
            setPomodoroTimeLeft(prevTime => {
                if (prevTime > 0) {
                    return prevTime - 1;
                } else {
                    if (pomodoroStatus === 'active') {
                        setPomodoroStatus('breaking');
                        return POMODORO_BREAK_DURATION;
                    } else if (pomodoroStatus === 'breaking') {
                        setPomodoroStatus('resting');
                        setIsPomodoroActive(false);
                        return POMODORO_WORK_DURATION;
                    }
                    return 0;
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPomodoroActive, pomodoroStatus, currentScreen]);

    const handlePomodoroToggle = () => {
        if (pomodoroStatus === 'resting') {
            setPomodoroStatus('active');
            setPomodoroTimeLeft(POMODORO_WORK_DURATION);
            setIsPomodoroActive(true);
        }
    };

    const handleQuizComplete = (data: { score: number; weak_topics: string[] }) => {
        setLastQuizWeakTopics(data.weak_topics);
        fetchDashboardData();
        setCurrentScreen('feedback');
    };

    const handleExitQuiz = () => {
        setCurrentScreen('quiz_select');
    };

    const handleStartQuiz = (subject: string) => {
        if (pomodoroStatus !== 'active') {
            alert("Ahoy! You must be in an active training session (Pomodoro Mode) to embark on a Bounty Quest. Click the button on the dashboard to start!");
            return;
        }
        setCurrentSubject(subject);
        setCurrentScreen('quiz_battle');
        setIsSidebarOpen(false);
    };

    const navigate = (screen: LoggedInScreen) => {
        setCurrentScreen(screen);
        setIsSidebarOpen(false);
    }


    const navItems = [
        { name: 'Logbook (Dashboard)', screen: 'dashboard', icon: LayoutDashboard },
        { name: 'Grand Line Rankings', screen: 'leaderboard', icon: Trophy },
        { name: 'Bounty Quests (Quiz)', screen: 'quiz_select', icon: Zap },
        { name: 'Shanks\' Report', screen: 'feedback', icon: MessageSquare },
        { name: 'Grand Line Maps', screen: 'resources', icon: BookOpen }, 
        { name: 'Mission Log', screen: 'todo_list', icon: List },        
    ];

    let screenContent;
    switch (currentScreen) {
        case 'dashboard':
            const isBreakTime = pomodoroStatus === 'breaking';
            const isResting = pomodoroStatus === 'resting';

            const timerMins = Math.floor(pomodoroTimeLeft / 60);
            const timerSecs = pomodoroTimeLeft % 60;
            const timeDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;
            const buttonText = isResting ? 'Start Pomodoro Mode (Begin Training)' : (isBreakTime ? `Break Time: ${timeDisplay}` : `Training Active: ${timeDisplay}`);

            screenContent = (
                <div className="p-6 md:p-10 bg-gray-900/90 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-yellow-500/70 backdrop-blur-md">
                    <h1 className="text-3xl font-extrabold text-red-600 mb-6 border-b-2 border-yellow-500 pb-4 drop-shadow-md">
                        Straw Hat Pirate Logbook - Welcome Aboard, {username}!
                    </h1>
                    {loadingDashboard ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
                            <p className="text-white font-black text-xl">Charting the Grand Line...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-red-800 rounded-xl shadow-lg border-2 border-yellow-500 text-white">
                                    <Trophy className="w-6 h-6 text-yellow-500 mb-1" />
                                    <p className="text-xs font-bold uppercase">Current Bounty</p>
                                    <p className="text-2xl font-black">{dashboardData?.trainer_card.xp.toLocaleString() || 0} Berries</p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-2 border-red-600 text-white">
                                    <User className="w-6 h-6 text-red-600 mb-1" />
                                    <p className="text-xs font-bold uppercase">Nakama Level</p>
                                    <p className="text-2xl font-black">{dashboardData?.trainer_card.level || 1}</p>
                                </div>
                            </div>

                            <p className="text-gray-300 text-lg font-bold">
                                Your **Nakama: {partnerName}** is ready for the next adventure.
                            </p>
                            <div className="mt-6 p-4 bg-gray-800 border-l-4 border-red-600 rounded-r-lg">
                                <p className="text-yellow-500 font-bold">Last Mission Report:</p>
                                <p className="text-gray-400 text-sm">Weakest Seas (Topics): **{dashboardData?.last_weak_topics.join(', ') || 'None found. Good work!'}**</p>
                            </div>

                            <button
                                onClick={handlePomodoroToggle}
                                disabled={isBreakTime}
                                className={`mt-8 w-full py-4 font-black text-xl rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.01]
                                    ${isBreakTime
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : isResting
                                            ? 'bg-yellow-500 text-black shadow-yellow-400/50 hover:bg-yellow-600'
                                            : 'bg-red-600 text-white shadow-red-500/50 animate-pulse'
                                    }`}
                            >
                                <Zap className="inline w-6 h-6 mr-2" /> {buttonText}
                            </button>

                            <button
                                onClick={() => navigate('quiz_select')}
                                className="mt-4 w-full py-2 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition"
                            >
                                Continue to Bounty Quests
                            </button>
                        </>
                    )}
                </div>
            );
            break;
        case 'leaderboard':
            screenContent = <LeaderboardScreen />;
            break;
        case 'quiz_select':
            screenContent = (
                <QuizSubjectSelectionScreen
                    onStartQuiz={handleStartQuiz}
                    dashboardData={dashboardData}
                    pomodoroStatus={pomodoroStatus}
                    pomodoroTimeLeft={pomodoroTimeLeft}
                />
            );
            break;
        case 'quiz_battle':

            screenContent = (
                <div className="text-center p-10 bg-gray-800 rounded-xl w-full max-w-2xl mx-auto border-4 border-red-600">
                    <h2 className="text-3xl font-black text-yellow-500 mb-4">Grand Line Bounty Quest: Battle Engaged</h2>
                    <p className="text-lg text-white mt-2 mb-6">You are fighting for **{currentSubject}** knowledge! (Note: The Quiz UI below uses the Pokémon theme.)</p>
                    <QuizBattle
                        subject={currentSubject || 'Physics'} 
                        onQuizComplete={handleQuizComplete}
                        onExit={handleExitQuiz}
                    />
                </div>
            );
            break;
        case 'feedback':
            screenContent = (
                <FeedbackScreen
                    weakTopics={lastQuizWeakTopics}
                    trainerUsername={username}
                    pokemonName={partnerName}
                />
            );
            break;
        case 'resources': 
            screenContent = <ResourceScreen />;
            break;
        case 'todo_list':
            screenContent = <TodoListScreen />;
            break;
        default:
            screenContent = <p className="text-gray-900">Choose your destination!</p>;
    }

    return (
        <div className="flex min-h-screen bg-gray-900 font-inter">
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                             lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out
                             w-72 bg-gray-800 shadow-xl border-r-4 border-red-600 z-30 flex flex-col`}>

                <div className="p-6 flex items-center justify-between border-b border-red-700 h-24">
                    <div className="flex items-center space-x-2 text-3xl font-black">
                        <Trophy className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500">One</span><span className="text-white">Piece</span>
                    </div>
                    <button
                        className="lg:hidden text-gray-400 hover:text-red-400 p-2 rounded-full bg-gray-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-grow p-6 space-y-3">
                    {navItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.screen as LoggedInScreen)}
                            className={`flex items-center w-full px-5 py-3 rounded-lg font-bold transition-all duration-300
                                        ${currentScreen === item.screen || (item.screen === 'quiz_select' && currentScreen === 'quiz_battle')
                                            ? 'bg-red-700 text-white shadow-xl shadow-red-500/30 transform scale-[1.02] border border-yellow-500'
                                            : 'text-gray-300 hover:bg-red-900/40 hover:text-yellow-500'
                                        }`}
                        >
                            <item.icon className="w-6 h-6 mr-3" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-red-700">
                    <p className="text-base font-semibold text-gray-400 mb-1 truncate">
                        Captain: {username}
                    </p>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 mt-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition shadow-lg"
                    >
                        <XCircle className="w-5 h-5 mr-2" /> Abandon Ship
                    </button>
                </div>
            </aside>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
                <header className="flex justify-between items-center lg:hidden sticky top-0 bg-gray-900/90 backdrop-blur-md z-20 py-4 mb-4 rounded-b-xl border-b border-red-500/50 shadow-md">
                    <div className="flex items-center space-x-2 text-2xl font-black">
                        <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500">One</span><span className="text-white">Piece</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-red-600 text-white rounded-xl shadow-xl hover:bg-red-700 transition"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="relative z-10">
                    {screenContent}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const { isLoggedIn, login, logout, token, theme } = useAuth();

    const initialScreen = isLoggedIn ? 'main' : 'landing';
    const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);

    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    useEffect(() => {
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'landing')) {
            setCurrentScreen('main');
        } else if (!isLoggedIn && currentScreen === 'main') {
            setCurrentScreen('landing');
        }
    }, [isLoggedIn, currentScreen]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) return;

        setLoadingDashboard(true);
        try {
            const maxRetries = 3;
            let response = null;
            let data: DashboardData | null = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/dashboard', {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    data = await response.json();

                    if (response.ok && !data.error) {
                        if (data && data.pokemon_panel) {
                            data.pokemon_panel.image_url = getPokemonImageUrl(data.pokemon_panel.name);
                        }
                        break;
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || 'Failed to fetch dashboard data after multiple retries.');
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }

            setDashboardData(data as DashboardData);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoadingDashboard(false);
        }
    }, [token]);


    useEffect(() => {
        if (isLoggedIn) {
            fetchDashboardData();
        }
    }, [isLoggedIn, fetchDashboardData]);


    const handleStartJourney = () => {
        setCurrentScreen('login');
    };

    const handleLoginSuccess = (authToken: string, userId: string, appTheme: AppTheme) => {
        login(authToken, userId, appTheme);
        setCurrentScreen('main');
    };
    const renderScreen = () => {
        if (currentScreen === 'landing') {
            return <LandingScreen onStartJourney={handleStartJourney} />;
        }

        if (currentScreen === 'login') {
            return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }

        if (currentScreen === 'main' && isLoggedIn) {

            if (theme === 'pokemon_kalos') {
                return (
                    <MainLayout
                        dashboardData={dashboardData}
                        loadingDashboard={loadingDashboard}
                        fetchDashboardData={fetchDashboardData}
                        logout={logout}
                    />
                );
            } else if (theme === 'one_piece') {
                return (
                    <OnePieceMainLayout
                        dashboardData={dashboardData}
                        loadingDashboard={loadingDashboard}
                        fetchDashboardData={fetchDashboardData}
                        logout={logout}
                    />
                );
            }
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white">
                    <p className="text-xl">Theme **{theme}** selected but not yet fully integrated.</p>
                    <button onClick={logout} className="ml-4 p-2 bg-red-600 rounded">Logout</button>
                </div>
            );

        }
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    };

    return (
        <div className="font-inter">
            {renderScreen()}
        </div>
    );
};

export default App;
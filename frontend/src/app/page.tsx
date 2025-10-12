


'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation'; // Removed, as next/navigation is not available in this environment
import { Heart, Zap, Award, BookOpen, ChevronRight, CheckCircle, XCircle, Loader2, User, Star, TrendingUp, Trophy, Egg } from 'lucide-react';
// import pikachu_bg from '../public/images/pikachu_bg.png'; // Path imports won't work in a single file environment, using direct path in <img src>


// --- Mock Auth Context (Unchanged) ---
const useAuth = () => {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUserId = localStorage.getItem('user_id');
        if (storedToken && storedUserId) {
            setToken(storedToken);
            setUserId(storedUserId);
            setIsLoggedIn(true);
        }
    }, []);

    const login = (authToken: string, uid: string) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_id', uid);
        setToken(authToken);
        setUserId(uid);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        setToken(null);
        setUserId(null);
        setIsLoggedIn(false);
    };

    return { token, userId, isLoggedIn, login, logout };
};


// --- Types for Data (Unchanged) ---
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

// --- Component: Quiz Question Renderer (UI Updated for Yellow Theme) ---
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
        let classes = 'p-4 my-3 rounded-xl transition-all duration-200 cursor-pointer border-2 text-lg font-semibold ';

        if (isSubmissionReview) {
            if (option === answer) {
                classes += 'bg-green-100 border-green-500 text-green-800 shadow-lg';
            } else if (option === selectedAnswer && option !== answer) {
                classes += 'bg-red-100 border-red-500 text-red-800 shadow-lg';
            } else {
                classes += 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100';
            }
        } else {
            if (option === selectedAnswer) {
                classes += 'bg-red-500 border-red-700 shadow-xl text-white';
            } else {
                classes += 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100';
            }
        }
        return classes;
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 border-4 border-red-500/50">
            <div className="text-sm font-semibold text-red-500 mb-2">
                Question {questionIndex + 1} of {totalQuestions}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{text}</h3>
            <p className="text-xs text-gray-500 mb-6 italic border-b border-gray-300 pb-2">Topic: {topic}</p>

            {options.map((option, index) => (
                <div
                    key={index}
                    className={getOptionClasses(option)}
                    onClick={!isSubmissionReview ? () => handleOptionSelect(option) : undefined}
                >
                    {option}
                    {isSubmissionReview && option === answer && (
                        <CheckCircle className="inline w-5 h-5 ml-2 text-green-600" />
                    )}
                    {isSubmissionReview && option === selectedAnswer && option !== answer && (
                        <XCircle className="inline w-5 h-5 ml-2 text-red-600" />
                    )}
                </div>
            ))}

            {isSubmissionReview && selectedAnswer && (
                <p className={`mt-6 p-3 rounded-lg text-sm font-semibold ${question.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {question.isCorrect ? 'You answered correctly! Well done!' : `Selected "${selectedAnswer}". Correct answer was: "${answer}".`}
                </p>
            )}
        </div>
    );
};


// --- Component: Quiz Battle (UI Updated for Yellow Theme) ---

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
        if (loading || isReviewing) return; 

        if (timeLeft <= 0) {
            handleTimeExpired();
            return;
        }

        const timerId = setTimeout(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timerId); 
    }, [timeLeft, currentQuestionIndex, loading, isReviewing]);

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
            const response = await fetch('http://127.0.0.1:5000/api/generate_quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ subject }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to generate quiz. Check API key and server logs.');
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
            console.log("Please select an option before moving to the next question!");
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
        const incorrectTopics: string[] = [];
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

        Object.keys(topicIncorrectCounts).forEach(topic => {
            if (topicIncorrectCounts[topic] > 0) {
                incorrectTopics.push(topic);
            }
        });
        const finalWeakTopics = incorrectTopics;


        setLoading(true);
        fetch('http://127.0.0.1:5000/api/submit_quiz', {
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
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.error) {
                setError(data.error);
                return;
            }
            
            setIsReviewing(true); 
            setSubmissionResult(data); 
            setCurrentQuestionIndex(0); 
        })
        .catch(err => {
            console.error("Submission Error:", err);
            setError("Failed to submit results.");
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-2xl h-64 w-full max-w-lg mx-auto border-4 border-red-500/50">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
                <p className="text-gray-900 font-semibold">Generating Personalized Quiz on {subject}...</p>
                <p className="text-sm text-gray-500 mt-1">This might take a moment as the AI is crafting your questions.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-lg mx-auto text-red-800">
                <h3 className="text-xl font-bold text-red-600 mb-3">Quiz Error</h3>
                <p className="text-red-500">{error}</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Go Back to Dashboard
                </button>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto text-gray-900">
                <p className="text-lg font-semibold text-gray-500">Quiz data is unavailable.</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Return
                </button>
            </div>
        );
    }

    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const nextButtonText = isLastQuestion ? 'Submit Quiz' : 'Next Question';
    const nextButtonDisabled = !currentQuestion.selectedAnswer;

    const timerClasses = `text-3xl font-extrabold ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center border-b border-gray-300 pb-3">{quiz.quiz_title}</h2>
            
            {!isReviewing && (
                <div className="text-center mb-6">
                    <div className="p-3 bg-white rounded-xl shadow-lg inline-block border border-red-500/50">
                        <span className="text-xs text-gray-500 block mb-1">TIME REMAINING</span>
                        <span className={timerClasses}>{timeLeft}s</span>
                    </div>
                </div>
            )}
            
            {isReviewing ? (
                <div className="flex flex-col items-center">
                    <h3 className="text-3xl font-extrabold text-red-500 mb-6">Quiz Review 🧐</h3>
                    
                    <QuizQuestion
                        question={currentQuestion}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={quiz.questions.length}
                        handleOptionSelect={() => {}} 
                        isSubmissionReview={true} 
                    />

                    <div className="mt-6 flex justify-between space-x-4 w-full max-w-lg">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-xl shadow-lg hover:bg-gray-400 transition disabled:opacity-50"
                        >
                            <ChevronRight className="inline w-5 h-5 mr-1 transform rotate-180" /> Previous
                        </button>
                        
                        {isLastQuestion ? (
                            <button
                                onClick={handleReviewComplete} 
                                className="px-6 py-3 bg-green-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-green-700 transition"
                            >
                                Finished Reviewing
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition"
                            >
                                Next Question <ChevronRight className="inline w-5 h-5 ml-1" />
                            </button>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-gray-100 border border-red-500 rounded-lg w-full max-w-lg">
                        <p className="text-center font-bold text-xl text-red-500">
                            Final Score: {quiz.questions.filter(q => q.isCorrect).length} / {quiz.questions.length}
                        </p>
                    </div>

                </div>
            ) : (
                <>
                    <QuizQuestion
                        question={currentQuestion}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={quiz.questions.length}
                        handleOptionSelect={handleOptionSelect}
                        isSubmissionReview={false}
                    />
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => handleNext(false)} 
                            disabled={nextButtonDisabled}
                            className={`px-10 py-4 font-extrabold text-lg rounded-xl transition duration-300 transform shadow-2xl
                                ${nextButtonDisabled
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500 text-white hover:bg-red-400 hover:scale-[1.01] ring-4 ring-red-300/50'
                                }
                            `}
                        >
                            {nextButtonText}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};


const FeatureRow: React.FC = () => {
    // 1. Define the features with Pikachu added
    const features = [
        { 
            name: "Pikachu", 
            image: "/images/pikachu_starter.png", // Assuming you have a starter image for Pikachu
            color: "bg-yellow-500", // Bright yellow for Pikachu's container
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

                {/* Feature Cards Grid: CHANGED to grid-cols-4 for desktop (lg:), but kept md:grid-cols-3 for medium screens if needed, and cols-1 for mobile. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => {
                        // Dynamically determine the Tailwind gradient classes
                        let titleClasses = "text-2xl font-bold mb-2 ";

                        if (feature.name === 'Pikachu') {
                            // Electric Yellow Gradient for Pikachu ⚡
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500';
                        } else if (feature.name === 'Bulbasaur') {
                            // Enhanced Green Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-600';
                        } else if (feature.name === 'Squirtle') {
                            // Enhanced Blue Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-600';
                        } else if (feature.name === 'Charmander') {
                            // Reddish Orange Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600';
                        } else {
                            // Default fallback
                            titleClasses += 'text-white';
                        }

                        return (
                            <div 
                                key={feature.name} 
                                className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl transition transform hover:scale-[1.03] duration-300 border border-gray-700 hover:border-yellow-400"
                            >
                                {/* Circular Image Container */}
                                <div className="flex justify-center mb-6">
                                    <div className={`w-40 h-40 flex items-center justify-center rounded-full p-2 ${feature.color} shadow-inner shadow-black/20 overflow-hidden`}>
                                        <img
                                            src={feature.image}
                                            alt={feature.name}
                                            className="w-full h-full object-cover drop-shadow-lg scale-175 transform -translate-y-2" 
                                            onError={(e) => { e.currentTarget.src = `https://placehold.co/160x160/${feature.color.replace('bg-[#','').replace(']','')}/white?text=${feature.name}`; }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Apply the dynamic gradient class to the title */}
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
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden font-inter rounded-xl shadow-2xl">
            {/* 1. Custom Navigation Bar (Matching Image) */}
            <nav className="relative z-20 w-full p-6 flex justify-between items-center bg-transparent">
                <div className="flex items-center space-x-2 text-white text-2xl font-bold">
                    <Egg className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    <span>PokeQuest</span>
                </div>
                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center space-x-6">
                    {['Home', 'About', 'Learn', 'Contact'].map((item) => (
                        <a key={item} href="#" className="text-gray-300 hover:text-yellow-400 transition font-medium">
                            {item}
                        </a>
                    ))}
                    {/* The Explore/Login button (using Explore text from the image) */}
                    <button onClick={onStartJourney} className="px-5 py-2 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-500 transition">
                        Explore
                    </button>
                </div>
                {/* Mobile Login Button */}
                <button onClick={onStartJourney} className="sm:hidden px-3 py-1 bg-yellow-400 text-black font-bold rounded-full">
                    Login
                </button>
            </nav>

            {/* 2. Main Content & Background Image (Hero Section) */}
            {/* Removed flex-grow to allow FeatureRow to sit below the fold and scroll with the page */}
            <header className="flex flex-col md:flex-row relative overflow-hidden min-h-[calc(100vh-80px)]"> 
                
                {/* Content Container (NOW ON THE LEFT - Swapped md:w-1/2 ml-auto for md:w-1/2 mr-auto and md:items-start) */}
                <div className="relative z-10 flex flex-col justify-center items-center md:items-start w-full md:w-1/2 mr-auto p-8 lg:p-16 text-center md:text-left">
                    <h2 className="text-6xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tighter">
                        Choose Your Starter... <br className="hidden md:inline"/> Knowledge!
                    </h2>
                    
                    {/* Tagline/Description */}
                    <p className="text-base text-gray-300 mb-10 max-w-lg mx-auto md:mx-0">
                        Welcome to the PokeQuest! Explore the fascinating world of learning where every lesson is a new challenge. Choose your research topic, hatch a brilliant insight, and begin your quest to discover your potential and become an expert researcher.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center md:justify-start">
                        {/* Start Your Journey Button - Primary CTA to Login */}
                        <button 
                            onClick={onStartJourney}
                            className="flex items-center justify-center bg-yellow-400 text-black font-bold py-3 px-8 rounded-full shadow-xl 
                                    hover:bg-yellow-500 transition duration-300 text-lg transform hover:scale-[1.05]"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Start Your Journey
                        </button>
                        
                        {/* Hatch Your Egg Button (Ghost/Outline style - placeholder CTA) */}
                        <button className="flex items-center justify-center border-2 border-gray-500 text-gray-300 font-bold py-3 px-8 rounded-full 
                                    hover:border-yellow-400 hover:text-yellow-400 transition duration-300 text-lg">
                            <Egg className="w-5 h-5 mr-2" /> Hatch Your Egg
                        </button>
                    </div>
                </div>

                {/* Background Image (Pikachu) - Large, visually dominant (NOW ON THE RIGHT - Swapped md:left-0 for md:right-0) */}
                <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                    <img
                        src='/images/hero_pikachu.png'
                        alt="A stylized illustration of Pikachu welcoming users."
                        className="object-cover w-full h-full md:w-[70vw] md:h-full lg:w-[60vw] xl:w-[50vw]
                                 md:absolute md:right-0 md:bottom-0 md:translate-x-[15%] md:translate-y-[15%] 
                                 lg:translate-x-[10%] lg:translate-y-[10%] xl:translate-x-[0%] xl:translate-y-[10%]
                                 mix-blend-lighten"
                        // Fallback provided for safety and if path is not accessible
                        onError={(e) => {
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src='https://placehold.co/800x800/000000/F5D04C?text=Pikachu+Placeholder';
                        }}
                    />
                </div>
            </header>
            
            {/* 3. Feature Row (Placed after the Hero Section) */}
            <FeatureRow /> 

        </div>
    );
};

// --- Component: App (State Management & Global Wrapper - Header removed for Landing Page) ---
type Screen = 'landing' | 'login' | 'dashboard' | 'quiz' | 'leaderboard'; 

const App: React.FC = () => {
    const { isLoggedIn, login, logout, token, userId } = useAuth();
    
    // Ensure the initial screen is 'landing' if not logged in
    const [currentScreen, setCurrentScreen] = useState<Screen>(isLoggedIn ? 'dashboard' : 'landing');
    
    const [currentSubject, setCurrentSubject] = useState<string>('');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    
    // --- START: Background Setup (Dark Theme) ---
    // Set the main app background to pure black (aesthetic and full coverage).
    const appStyles: React.CSSProperties = {
        minHeight: '100vh',
        backgroundColor: '#000000', // Pure black
    };
    // --- END: Background Setup ---


    useEffect(() => {
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'landing')) {
            setCurrentScreen('dashboard');
            fetchDashboardData();
        } else if (!isLoggedIn && currentScreen !== 'login' && currentScreen !== 'landing') {
            setCurrentScreen('landing');
        }
    }, [isLoggedIn, currentScreen]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) return;

        setLoadingDashboard(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch dashboard data.');
            }

            setDashboardData(data);
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

    // Handlers
    
    const handleStartJourney = () => {
        setCurrentScreen('login');
    };

    const handleLoginSuccess = (authToken: string, userId: string) => {
        login(authToken, userId);
        setCurrentScreen('dashboard');
    };

    const handleStartQuiz = (subject: string) => {
        setCurrentSubject(subject);
        setCurrentScreen('quiz');
    };

    const handleQuizComplete = (data: { score: number; weak_topics: string[] }) => {
        console.log("Quiz completed and results submitted. Updating dashboard stats.");
        fetchDashboardData(); 
        setCurrentScreen('dashboard');
    };
    
    const handleExitQuiz = () => {
        setCurrentScreen('dashboard');
    };

    const handleViewLeaderboard = () => {
        setCurrentScreen('leaderboard');
    }
    
    const handleExitLeaderboard = () => {
        setCurrentScreen('dashboard');
    }


    // --- Render Current Screen ---
    const renderScreen = () => {
        if (currentScreen === 'landing') {
            return <LandingScreen onStartJourney={handleStartJourney} />;
        }
        
        if (!isLoggedIn && currentScreen === 'login') {
            return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }
        
        if (isLoggedIn && (currentScreen === 'landing' || currentScreen === 'login')) {
            setCurrentScreen('dashboard'); 
        }

        // --- Logged-In Screen Structure (includes Header) ---
        let screenContent;

        switch (currentScreen) {
            case 'dashboard':
                screenContent = (
                    // Dashboard is internally centered with max-w-4xl mx-auto
                    <div>
                        {loadingDashboard ? (
                            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-2xl h-64 w-full max-w-4xl mx-auto border-4 border-red-500/50">
                                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
                                <p className="text-gray-900 font-semibold">Loading Dashboard Data...</p>
                            </div>
                        ) : (
                            <Dashboard 
                                onStartQuiz={handleStartQuiz} 
                                dashboardData={dashboardData} 
                                onViewLeaderboard={handleViewLeaderboard}
                            />
                        )}
                    </div>
                );
                break;
            case 'quiz':
                screenContent = (
                    // QuizBattle is internally centered with max-w-2xl mx-auto
                    <div>
                        <QuizBattle 
                            subject={currentSubject} 
                            onQuizComplete={handleQuizComplete} 
                            onExit={handleExitQuiz} 
                        />
                    </div>
                );
                break;
            case 'leaderboard':
                screenContent = (
                    // LeaderboardScreen is internally centered with max-w-4xl mx-auto
                    <div>
                        <LeaderboardScreen onExit={handleExitLeaderboard} />
                    </div>
                );
                break;
            default:
                screenContent = null;
        }

        // This structure is returned ONLY when logged in (dashboard, quiz, leaderboard)
        return (
            <>
                {/* Custom Header for Logged-in Screens - still full width, sticky, bg-white */}
                <header className="bg-white shadow-xl p-4 flex justify-between items-center sticky top-0 z-20 border-b-4 border-red-500 mb-8 rounded-b-xl">
                    <button 
                        onClick={() => setCurrentScreen('dashboard')}
                        className="text-2xl font-extrabold text-gray-900 hover:text-red-500 transition"
                    >
                        Quiz Battle Trainer 🚀
                    </button>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-800 font-medium hidden sm:inline">Trainer: **{dashboardData?.trainer_card.username || '...'}**</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </header>
                {/* Apply padding only to the content area below the header, and ensure it uses max-width/centering internally */}
                <div className="px-4 sm:px-6 md:px-8"> 
                    {screenContent}
                </div>
            </>
        );
    };

    return (
        <div style={appStyles}>
            <main className="w-full min-h-screen relative z-10">
                {renderScreen()}
            </main>
        </div>
    );
};

// --- Helper StatCard (UI Updated for Yellow Theme) ---
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
    <div className="flex items-center p-4 bg-gray-100 rounded-xl shadow-lg border border-gray-300">
        <div className="p-3 bg-red-100 rounded-full mr-4 shadow-inner">
            {/* Clone element to force color on the icon */}
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-red-500' })}
        </div>
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
            <p className="text-xl font-extrabold text-gray-900">{value}</p>
        </div>
    </div>
);

// --- Component: Dashboard (UI Updated for Yellow Theme) ---
const Dashboard: React.FC<{ onStartQuiz: (subject: string) => void; dashboardData: DashboardData | null; onViewLeaderboard: () => void }> = ({ onStartQuiz, dashboardData, onViewLeaderboard }) => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

    const weakTopics = dashboardData?.last_weak_topics || [];
    const trainer = dashboardData?.trainer_card;
    const pokemon = dashboardData?.pokemon_panel;
    
    const xp_parts = pokemon?.xp_stat.split('/');
    const current_xp_mod = parseInt(xp_parts?.[0] || '0');
    const required_xp_mod = parseInt(xp_parts?.[1] || '300');
    const xp_percent = required_xp_mod > 0 ? Math.min(100, (current_xp_mod / required_xp_mod) * 100) : 0;

    // Use image_url from API if available, otherwise use a placeholder
    const pokemonImageUrl = pokemon?.image_url || 'https://placehold.co/96x96/80ff80/black?text=NO+IMG';

    return (




        <div className="p-6 md:p-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-red-500/50">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 border-red-500 pb-4">Trainer Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-inner">
                    <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center">
                        <User className="w-6 h-6 mr-2 text-red-500" />
                        Trainer Card
                    </h2>
                    {trainer ? (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={<User />} label="Username" value={trainer.username} />
                            <StatCard icon={<Star />} label="Level" value={trainer.level} />
                            <StatCard icon={<Zap />} label="Total XP" value={trainer.xp} />
                            <StatCard icon={<TrendingUp />} label="Streak" value={trainer.streak} />
                            <StatCard icon={<Award />} label="Badges" value={dashboardData?.achievements.badges || 0} />
                        </div>
                    ) : (
                        <p className="text-gray-500">Loading trainer data...</p>
                    )}
                </div>

                <div className="lg:col-span-1 p-6 bg-red-50 border-4 border-red-500 rounded-xl shadow-2xl flex flex-col items-center text-center">
                    <h2 className="text-xl font-extrabold text-red-800 mb-4">
                        {pokemon?.name || 'Loading...'}
                    </h2>
                    
                    <div className="w-24 h-24 mb-4 border-4 border-red-500 shadow-xl rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                        <img 
                            src={pokemonImageUrl} 
                            alt={`${pokemon?.name} evolution stage`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/999999/white?text=Error'; }} 
                        />
                    </div>
                    
                    <p className="text-sm font-semibold text-gray-900">{pokemon?.evolution_status || 'Checking Status...'}</p>

                    <div className="w-full mt-4">
                        <p className="text-xs font-bold text-gray-500 mb-1 flex justify-between">
                            <span>XP Progress</span>
                            <span>{pokemon?.xp_stat || '0/300'}</span>
                        </p>
                        <div className="w-full bg-gray-300 rounded-full h-4 shadow-inner">
                            <div 
                                className="h-4 bg-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${xp_percent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-center mb-10">
                <button
                    onClick={onViewLeaderboard}
                    className="flex items-center px-8 py-4 bg-red-500 text-white font-extrabold rounded-xl shadow-2xl 
                            hover:bg-red-400 transition duration-300 transform hover:scale-[1.03] ring-4 ring-red-300/50"
                >
                    <Trophy className="w-6 h-6 mr-2 text-white" /> View Leaderboard
                </button>
            </div>
            
            <div className="mb-8 p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg shadow-inner">
                <h3 className="text-lg font-bold text-red-800 mb-2">Weakness Report</h3>
                {weakTopics.length > 0 ? (
                    <p className="text-sm text-gray-900 font-medium">
                        Your next quiz will **target** these areas: <span className="text-red-500 font-extrabold">{weakTopics.join(', ')}</span>
                    </p>
                ) : (
                    <p className="text-sm text-gray-900">No recent weakness data. Generating a balanced quiz!</p>
                )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-red-500" />
                Start a New Quiz Battle
            </h3>
            
            <p className="text-gray-500 mb-6">Select a subject to begin your personalized quiz battle and gain XP!</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => onStartQuiz(subject)}
                        className="flex items-center justify-center p-4 bg-red-600 text-white font-bold rounded-xl shadow-lg 
                                 hover:bg-red-700 transition duration-300 transform hover:scale-[1.03] text-center text-lg ring-2 ring-red-400"
                    >
                        {subject}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Leaderboard Screen (UI Updated for Yellow Theme) ---

const LeaderboardScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/leaderboard'); 

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch leaderboard data.');
            }

            setLeaderboard(data || []); 

        } catch (err: any) {
            console.error("Leaderboard Fetch Error:", err);
            if (err.message === 'Failed to fetch') {
                    setError("Could not connect to the API server. Please check the backend console.");
            } else {
                    setError(err.message || "An unknown error occurred while fetching the leaderboard.");
            }
            
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-red-500/50">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
                <p className="text-gray-900 font-semibold">Fetching Top Trainers...</p>
             </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-4xl mx-auto text-red-800">
                <h3 className="text-xl font-bold text-red-600 mb-3">Leaderboard Error</h3>
                <p className="text-red-500">{error}</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }
    
    const getMedal = (rank: number) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
        if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400 fill-gray-400" />;
        if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600 fill-amber-600" />;
        return <span className="w-6 h-6 text-gray-500 font-extrabold text-lg">{rank}</span>;
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-2xl border-4 border-red-500/50">
            <h2 className="text-4xl font-extrabold text-red-500 mb-6 flex items-center justify-center border-b-2 border-red-500 pb-4">
                <Trophy className="w-8 h-8 mr-3 text-red-500 fill-red-500" />
                The Global Leaderboard
            </h2>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total XP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 text-center">
                                    No trainers found on the leaderboard. Be the first!
                                </td>
                            </tr>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-100'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-2">
                                        {getMedal(index + 1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">{entry.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.level}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-500">{entry.xp.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{entry.pokemon_name}</td>
                                
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={onExit}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition duration-300 ring-2 ring-red-400"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};

// --- Login Screen (UI Updated for New Image Theme) ---

const LoginScreen: React.FC<{ onLoginSuccess: (token: string, userId: string) => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pokemonName, setPokemonName] = useState('Pikachu');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const endpoint = isRegisterMode ? 'register' : 'login';
        
        try {
            const body = isRegisterMode 
                ? { username, password, pokemon_name: pokemonName } 
                : { username, password };
            
            const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || `${endpoint} failed.`);
            }

            if (isRegisterMode) {
                setSuccessMessage("Registration successful! Please log in.");
                setIsRegisterMode(false);
            } else {
                onLoginSuccess(data.auth_token, data.user_id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Placeholder image URLs for the starter Pokémon for the aesthetic background
    const pokemonAssets = {
        pikachu: 'https://placehold.co/200x200/F0DB4F/000?text=Pikachu', // Using brighter yellow/black for Pikachu
        bulbasaur: 'https://placehold.co/150x150/8BC34A/000?text=Bulbasaur', // Green
        charmander: 'https://placehold.co/180x180/FF9800/000?text=Charmander', // Orange
        squirtle: 'https://placehold.co/160x160/2196F3/000?text=Squirtle', // Blue
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

       
                <div className="mb-5">
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
                <div className="mb-6">
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

        {/* Pokémon dropdown (only for register mode) */}
        {isRegisterMode && (
            <select
            value={pokemonName}
            onChange={(e) => setPokemonName(e.target.value)}
            className="w-full p-3 mb-6 border border-gray-500 bg-black/60 text-white rounded-lg
                        focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            >
            <option value="Pikachu">Pikachu</option>
            <option value="Charmander">Charmander</option>
            <option value="Bulbasaur">Bulbasaur</option>
            <option value="Squirtle">Squirtle</option>
            <option value="Turtwig">Turtwig</option>
            </select>
        )}

        {error && (
            <div className="p-3 mb-4 bg-red-700/80 text-white rounded-lg font-medium w-full text-center">
            {error}
            </div>
        )}

        {/* Login/Register Button */}
        <button
            onClick={handleSubmit}
            disabled={loading || !username || !password || (isRegisterMode && !pokemonName)}
            className="w-full py-3 mt-2 font-extrabold rounded-lg shadow-lg transition-all duration-300
                    bg-gradient-to-t from-orange-500 to-yellow-400
                    hover:from-orange-600 hover:to-yellow-300
                    text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
            {loading ? (
            <Loader2 className="w-5 h-5 inline animate-spin text-black" />
            ) : (
            isRegisterMode ? 'Register' : 'Login'
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

export default App;



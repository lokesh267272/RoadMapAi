
import { useState } from "react";
import { ArrowRight, Brain, Calendar, CheckCircle, BookOpen, Target, BarChart, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DemoTutorial from "./DemoTutorial";

const Hero = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="max-w-4xl mx-auto text-center animate-fadeInUp">
        <div className="inline-flex items-center justify-center gap-2 py-1 px-3 mb-4 border border-galactic-purple/30 rounded-full bg-charcoal-gray/50 backdrop-blur-sm">
          <Brain className="h-4 w-4 text-neon-blue" />
          <span className="text-sm font-medium text-light-gray">AI-Powered Learning Paths</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 text-soft-white">
          Master Any Skill with <span className="text-gradient">Personalized</span> Learning Roadmaps
        </h1>
        
        <p className="text-lg md:text-xl text-light-gray mb-8 max-w-2xl mx-auto">
          Achieve your learning goals faster with AI-generated day-by-day learning plans tailored to your pace and learning style.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button asChild size="lg" className="bg-neon-blue text-deep-space font-medium shadow-md hover:bg-emerald-mint hover:shadow-glow-sm transition-all">
            <Link to="/auth">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setIsDemoOpen(true)}
            className="bg-transparent border-electric-violet text-soft-white hover:bg-electric-violet/10 hover:border-emerald-mint transition-all"
          >
            View Demo
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <Brain className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">AI-Generated Roadmaps</h3>
            <p className="text-light-gray">
              Create customized learning paths optimized for your goals and available time
            </p>
          </div>
          
          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <Calendar className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">Daily Learning Schedule</h3>
            <p className="text-light-gray">
              Track your progress with a dedicated calendar view for daily learning tasks
            </p>
          </div>
          
          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <CheckCircle className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">Progress Tracking</h3>
            <p className="text-light-gray">
              Visualize your learning journey with detailed progress analytics
            </p>
          </div>

          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <Target className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">Goal Setting</h3>
            <p className="text-light-gray">
              Set clear learning objectives and milestones to keep you motivated
            </p>
          </div>

          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <BarChart className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">Performance Analytics</h3>
            <p className="text-light-gray">
              Get insights into your learning patterns and areas for improvement
            </p>
          </div>

          <div className="bg-charcoal-gray rounded-2xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-glow-md transition-all duration-300">
            <div className="bg-galactic-purple/30 p-3 rounded-lg mb-4">
              <Sparkles className="h-6 w-6 text-neon-blue" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-soft-white">Smart Recommendations</h3>
            <p className="text-light-gray">
              Receive personalized content suggestions based on your progress
            </p>
          </div>
        </div>

        {/* How it works section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-8 text-soft-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-galactic-purple/30 p-4 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-neon-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-soft-white">1. Choose Your Topic</h3>
              <p className="text-light-gray text-center">
                Select what you want to learn and set your learning goals
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-galactic-purple/30 p-4 rounded-full mb-4">
                <Brain className="h-8 w-8 text-neon-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-soft-white">2. Get Your Plan</h3>
              <p className="text-light-gray text-center">
                Receive a personalized learning roadmap generated by AI
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-galactic-purple/30 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-neon-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-soft-white">3. Start Learning</h3>
              <p className="text-light-gray text-center">
                Follow your daily tasks and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 py-12 px-6 rounded-3xl bg-gradient-to-r from-galactic-purple/40 to-midnight-indigo border border-galactic-purple/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-soft-white">Ready to Transform Your Learning?</h2>
          <p className="text-lg text-light-gray mb-8 max-w-xl mx-auto">
            Start your personalized learning journey today and unlock your full potential.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-neon-blue text-deep-space hover:bg-emerald-mint hover:shadow-glow-md transition-all"
          >
            <Link to="/auth">
              Get Started Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Demo Tutorial Dialog */}
      <DemoTutorial 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </div>
  );
};

export default Hero;

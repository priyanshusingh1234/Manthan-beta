const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const questions = [
  {
    title: "A passenger sitting in a moving train is at rest with respect to:",
    options: ["The trees outside", "The platform", "Fellow passengers in the train", "The railway track"],
    correct_option: 2,
    subject: "Science"
  },
  {
    title: "The motion of a drawer of a table being opened or closed is an example of:",
    options: ["Rotatory motion", "Rectilinear motion", "Curvilinear motion", "Oscillatory motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "A spinning top shows which type of motion?",
    options: ["Translatory motion", "Rotatory motion", "Oscillatory motion", "Vibratory motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "The motion of the hands of a clock is an example of:",
    options: ["Translatory motion only", "Periodic and Rotatory motion", "Oscillatory motion", "Non-periodic motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "Which of the following describes the shortest distance between the initial and final positions of a moving body?",
    options: ["Speed", "Velocity", "Displacement", "Path length"],
    correct_option: 2,
    subject: "Science"
  },
  {
    title: "If a car travels 50 km in the first hour, 40 km in the second hour, and 60 km in the third hour, its motion is:",
    options: ["Uniform motion", "Non-uniform motion", "Periodic motion", "Oscillatory motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "The SI unit of speed is:",
    options: ["km/h", "m/s", "cm/s", "m/min"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "The motion of a pendulum in a wall clock is:",
    options: ["Oscillatory and Periodic", "Translatory and Periodic", "Rotatory and Non-periodic", "Vibratory and Random"],
    correct_option: 0,
    subject: "Science"
  },
  {
    title: "A boy runs exactly one complete lap around a circular track of circumference 400 m. What is his displacement?",
    options: ["400 m", "200 m", "0 m", "800 m"],
    correct_option: 2,
    subject: "Science"
  },
  {
    title: "Which of the following devices is used to measure the distance travelled by a vehicle?",
    options: ["Speedometer", "Odometer", "Anemometer", "Barometer"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "The speed of a train is 72 km/h. What is its speed in m/s?",
    options: ["15 m/s", "20 m/s", "25 m/s", "30 m/s"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "Which of these is an example of vibratory motion?",
    options: ["A planet revolving around the sun", "The strings of a plucked guitar", "A car moving on a straight road", "A spinning top"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "A ball thrown vertically upwards and falling back to the ground undergoes:",
    options: ["Curvilinear motion", "Rectilinear motion", "Rotatory motion", "Oscillatory motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "When an object covers equal distances in equal intervals of time, it is said to have:",
    options: ["Uniform speed", "Variable speed", "Average speed", "Zero speed"],
    correct_option: 0,
    subject: "Science"
  },
  {
    title: "The motion of a drill machine bit making a hole in wood is:",
    options: ["Only rotatory", "Only translatory", "Both rotatory and translatory", "Oscillatory"],
    correct_option: 2,
    subject: "Science"
  },
  {
    title: "Average speed of a body is calculated by:",
    options: ["Total distance × Total time", "Total distance / Total time", "Total time / Total distance", "Initial speed + Final speed / 2"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "Which of the following is NOT a unit of distance?",
    options: ["Meter", "Centimeter", "Light year", "Kilogram"],
    correct_option: 3,
    subject: "Science"
  },
  {
    title: "A stone tied to a string and whirled in a circle represents:",
    options: ["Rectilinear motion", "Curvilinear motion", "Vibratory motion", "Random motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "The beating of the human heart is an example of:",
    options: ["Random motion", "Periodic motion", "Rotatory motion", "Rectilinear motion"],
    correct_option: 1,
    subject: "Science"
  },
  {
    title: "If a car is moving at a uniform speed of 15 m/s, how far will it travel in 10 seconds?",
    options: ["1.5 m", "150 m", "25 m", "1500 m"],
    correct_option: 1,
    subject: "Science"
  }
];

async function run() {
  try {
    const gauntletData = {
      slug: 'class-7-motion-battle',
      title: 'Motion Arena Battle',
      description: '20 high-quality physics questions on Motion. Score ≥75% to earn 50 bonus Arena Points!',
      subject: 'Science',
      class_grade: '7',
      difficulty: 'hard',
      question_count: 20,
      time_minutes: 15,
      color: 'from-violet-600 to-fuchsia-700',
      reward: 'Motion Master + 50 Bonus Points',
      is_active: true,
      reward_points: 50,
      reward_threshold_percent: 75,
      custom_questions: questions
    };

    const { data, error } = await supabase
      .from('gauntlets')
      .insert(gauntletData)
      .select('id');

    if (error) {
      console.error('Error inserting arena battle:', error);
    } else {
      console.log(`Successfully created Arena Battle for Motion!`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();

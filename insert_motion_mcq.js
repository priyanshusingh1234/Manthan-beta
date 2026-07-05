const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const TEACHER_ID = '83ea8424-f849-4773-b1fc-aaa987d33b2b';

const questions = [
  {
    title: "A passenger sitting in a moving train is at rest with respect to:",
    options: ["The trees outside", "The platform", "Fellow passengers in the train", "The railway track"],
    correct_option: 2,
    explanation: "Rest and motion are relative terms. The passenger is not changing position with respect to fellow passengers, so they are at rest relative to them.",
    hint: "Think about who is moving along with the passenger at the same speed."
  },
  {
    title: "The motion of a drawer of a table being opened or closed is an example of:",
    options: ["Rotatory motion", "Rectilinear motion", "Curvilinear motion", "Oscillatory motion"],
    correct_option: 1,
    explanation: "The drawer moves in a straight line path when pulled or pushed, which is the definition of rectilinear (translatory) motion.",
    hint: "Does the drawer turn, or does it move in a straight line?"
  },
  {
    title: "A spinning top shows which type of motion?",
    options: ["Translatory motion", "Rotatory motion", "Oscillatory motion", "Vibratory motion"],
    correct_option: 1,
    explanation: "A spinning top rotates about its own central axis without necessarily changing its position, which is pure rotatory motion.",
    hint: "The object turns around a fixed axis."
  },
  {
    title: "The motion of the hands of a clock is an example of:",
    options: ["Translatory motion only", "Periodic and Rotatory motion", "Oscillatory motion", "Non-periodic motion"],
    correct_option: 1,
    explanation: "The hands of a clock rotate about a fixed point (rotatory) and complete one round in a fixed interval of time (periodic).",
    hint: "Consider both the path it takes and the time it takes to repeat."
  },
  {
    title: "Which of the following describes the shortest distance between the initial and final positions of a moving body?",
    options: ["Speed", "Velocity", "Displacement", "Path length"],
    correct_option: 2,
    explanation: "Displacement is the straight-line, shortest distance from the starting point to the ending point, regardless of the actual path taken.",
    hint: "It is a vector quantity that ignores the actual route taken."
  },
  {
    title: "If a car travels 50 km in the first hour, 40 km in the second hour, and 60 km in the third hour, its motion is:",
    options: ["Uniform motion", "Non-uniform motion", "Periodic motion", "Oscillatory motion"],
    correct_option: 1,
    explanation: "The car covers unequal distances in equal intervals of time (1 hour), which means its speed is changing. This is non-uniform motion.",
    hint: "Is the distance covered the same in every hour?"
  },
  {
    title: "The SI unit of speed is:",
    options: ["km/h", "m/s", "cm/s", "m/min"],
    correct_option: 1,
    explanation: "The Standard International (SI) unit for distance is meters (m) and for time is seconds (s), making the SI unit of speed m/s.",
    hint: "Look for the standard scientific units for distance and time."
  },
  {
    title: "The motion of a pendulum in a wall clock is:",
    options: ["Oscillatory and Periodic", "Translatory and Periodic", "Rotatory and Non-periodic", "Vibratory and Random"],
    correct_option: 0,
    explanation: "The pendulum swings back and forth about a mean position (oscillatory) and takes a fixed amount of time for each swing (periodic).",
    hint: "It goes to and fro in regular time intervals."
  },
  {
    title: "A boy runs exactly one complete lap around a circular track of circumference 400 m. What is his displacement?",
    options: ["400 m", "200 m", "0 m", "800 m"],
    correct_option: 2,
    explanation: "Since he completed one full lap, his final position is exactly the same as his initial position. Therefore, the shortest distance between them is zero.",
    hint: "Displacement depends only on the starting and ending points."
  },
  {
    title: "Which of the following devices is used to measure the distance travelled by a vehicle?",
    options: ["Speedometer", "Odometer", "Anemometer", "Barometer"],
    correct_option: 1,
    explanation: "An odometer is an instrument in the dashboard of a vehicle that records the total distance travelled by the vehicle.",
    hint: "It sounds like 'odour' but measures distance."
  },
  {
    title: "The speed of a train is 72 km/h. What is its speed in m/s?",
    options: ["15 m/s", "20 m/s", "25 m/s", "30 m/s"],
    correct_option: 1,
    explanation: "To convert km/h to m/s, multiply by 5/18. Therefore, 72 × (5/18) = 4 × 5 = 20 m/s.",
    hint: "Multiply the speed by 5/18."
  },
  {
    title: "Which of these is an example of vibratory motion?",
    options: ["A planet revolving around the sun", "The strings of a plucked guitar", "A car moving on a straight road", "A spinning top"],
    correct_option: 1,
    explanation: "When a guitar string is plucked, it undergoes rapid to-and-fro motion (vibrations) producing sound, which is vibratory motion.",
    hint: "Look for rapid back-and-forth movements."
  },
  {
    title: "A ball thrown vertically upwards and falling back to the ground undergoes:",
    options: ["Curvilinear motion", "Rectilinear motion", "Rotatory motion", "Oscillatory motion"],
    correct_option: 1,
    explanation: "If thrown perfectly vertically, the ball travels up and down along a single straight line, making it rectilinear motion.",
    hint: "It goes straight up and comes straight down."
  },
  {
    title: "When an object covers equal distances in equal intervals of time, it is said to have:",
    options: ["Uniform speed", "Variable speed", "Average speed", "Zero speed"],
    correct_option: 0,
    explanation: "Uniform speed (or uniform motion) occurs when an object travels at a constant rate, meaning equal distances in equal time intervals.",
    hint: "The word 'equal' implies constancy."
  },
  {
    title: "The motion of a drill machine bit making a hole in wood is:",
    options: ["Only rotatory", "Only translatory", "Both rotatory and translatory", "Oscillatory"],
    correct_option: 2,
    explanation: "The drill bit spins (rotatory motion) while simultaneously moving forward into the wood (translatory motion).",
    hint: "Does it spin? Does it also move deeper?"
  },
  {
    title: "Average speed of a body is calculated by:",
    options: ["Total distance × Total time", "Total distance / Total time", "Total time / Total distance", "Initial speed + Final speed / 2"],
    correct_option: 1,
    explanation: "Average speed gives an overall idea of how fast an object travelled over a trip, calculated by dividing total distance by total time.",
    hint: "Speed is a measure of distance covered per unit of time."
  },
  {
    title: "Which of the following is NOT a unit of distance?",
    options: ["Meter", "Centimeter", "Light year", "Kilogram"],
    correct_option: 3,
    explanation: "Kilogram is the standard unit of mass. A light year is a unit of astronomical distance.",
    hint: "One of these is used to measure weight/mass."
  },
  {
    title: "A stone tied to a string and whirled in a circle represents:",
    options: ["Rectilinear motion", "Curvilinear motion", "Vibratory motion", "Random motion"],
    correct_option: 1,
    explanation: "The stone travels along a curved (circular) path, so its motion is a specific type of curvilinear motion (circular motion).",
    hint: "The path of the stone is a curve."
  },
  {
    title: "The beating of the human heart is an example of:",
    options: ["Random motion", "Periodic motion", "Rotatory motion", "Rectilinear motion"],
    correct_option: 1,
    explanation: "Under normal resting conditions, the heart beats at regular, equal intervals of time, making it a periodic motion.",
    hint: "It repeats after fixed time intervals."
  },
  {
    title: "If a car is moving at a uniform speed of 15 m/s, how far will it travel in 10 seconds?",
    options: ["1.5 m", "150 m", "25 m", "1500 m"],
    correct_option: 1,
    explanation: "Distance = Speed × Time. Therefore, Distance = 15 m/s × 10 s = 150 meters.",
    hint: "Multiply the speed by the time."
  }
];

async function run() {
  try {
    const formattedQuestions = questions.map(q => ({
      title: q.title,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      hint: q.hint,
      question_type: 'mcq',
      subject: 'Science',
      chapter: 'Motion',
      class_grade: '7',
      points: 2,
      time_limit: 2, // Assume minutes or whatever time_limit uses
      created_by: TEACHER_ID,
      created_at: new Date().toISOString(),
      is_published: true
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(formattedQuestions)
      .select('id');

    if (error) {
      console.error('Error inserting questions:', error);
    } else {
      console.log(`Successfully inserted ${data.length} questions for Motion!`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();

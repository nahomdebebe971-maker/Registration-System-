import { Registration, GradeSetting, ClassAssignment } from '../types';

// Fisher-Yates shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function runSmartClassAssignment(
  registrations: Registration[],
  settings: GradeSetting[]
): {
  updatedRegistrations: Registration[];
  classesSummary: ClassAssignment[];
} {
  const updatedRegistrations = [...registrations];
  const classesSummary: ClassAssignment[] = [];

  // Grades to process
  const grades: (10 | 11 | 12)[] = [10, 11, 12];

  grades.forEach(grade => {
    // Find settings for the grade, default if not specified
    const gradeSetting = settings.find(s => Number(s.grade) === grade);
    const classSize = gradeSetting ? gradeSetting.students_per_class : 60;

    // Filter approved students in this grade
    const approved = updatedRegistrations.filter(
      r => r.promoted_grade === grade && r.status === 'Approved'
    );

    const N = approved.length;
    if (N === 0) return;

    // Sort by average descending
    const sortedApproved = [...approved].sort((a, b) => b.average - a.average);

    // Special class: we take the top S (classSize) students
    const specialClassStudents = sortedApproved.slice(0, classSize);
    const remainingStudents = sortedApproved.slice(classSize);

    const specialClassName = `${grade}A`;

    // Assign those to Special Class ${grade}A
    specialClassStudents.forEach(student => {
      const idx = updatedRegistrations.findIndex(r => r.id === student.id);
      if (idx !== -1) {
        updatedRegistrations[idx] = {
          ...updatedRegistrations[idx],
          class_assignment: specialClassName
        };
      }
    });

    // Record the special class summary
    if (specialClassStudents.length > 0) {
      classesSummary.push({
        grade,
        class_name: specialClassName,
        class_type: 'Special',
        total_students: specialClassStudents.length
      });
    }

    // Remaining students assignment with gender balancing
    const remCount = remainingStudents.length;
    if (remCount > 0) {
      // Calculate how many subsequent regular classes are needed
      const numRegularClassesNeeded = Math.ceil(remCount / classSize);
      
      // Class letters: B, C, D, E, F, G, H...
      const regularClassBuckets: { className: string; students: Registration[] }[] = [];
      for (let i = 0; i < numRegularClassesNeeded; i++) {
        const letter = String.fromCharCode(66 + i); // 66 is 'B'
        regularClassBuckets.push({
          className: `${grade}${letter}`,
          students: []
        });
      }

      // Group remaining students by sex to maintain balance
      const males = shuffleArray(remainingStudents.filter(s => s.sex === 'Male'));
      const females = shuffleArray(remainingStudents.filter(s => s.sex === 'Female'));

      // Distribute males round-robin
      let classIdx = 0;
      males.forEach(male => {
        regularClassBuckets[classIdx].students.push(male);
        classIdx = (classIdx + 1) % numRegularClassesNeeded;
      });

      // Distribute females round-robin (reverse-start to improve balance if needed)
      classIdx = numRegularClassesNeeded - 1;
      if (classIdx < 0) classIdx = 0;
      females.forEach(female => {
        regularClassBuckets[classIdx].students.push(female);
        classIdx = classIdx === 0 ? numRegularClassesNeeded - 1 : classIdx - 1;
      });

      // Shuffling the results within each class to hide insertion order, and updating major collection
      regularClassBuckets.forEach(bucket => {
        bucket.students.forEach(student => {
          const idx = updatedRegistrations.findIndex(r => r.id === student.id);
          if (idx !== -1) {
            updatedRegistrations[idx] = {
              ...updatedRegistrations[idx],
              class_assignment: bucket.className
            };
          }
        });

        classesSummary.push({
          grade,
          class_name: bucket.className,
          class_type: 'Regular',
          total_students: bucket.students.length
        });
      });
    }
  });

  return {
    updatedRegistrations,
    classesSummary
  };
}

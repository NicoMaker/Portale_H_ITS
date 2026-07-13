// Repository statistiche: query aggregate per dashboard e analytics admin
const { dbGet, dbAll } = require("../config/database");

const statsRepository = {
  async statisticheBase() {
    const [utenti, corsi, orari, perRuolo] = await Promise.all([
      dbGet("SELECT COUNT(*) as count FROM users"),
      dbGet("SELECT COUNT(*) as count FROM courses"),
      dbGet("SELECT COUNT(*) as count FROM schedules"),
      dbAll("SELECT role, COUNT(*) as count FROM users GROUP BY role"),
    ]);
    return {
      totalUsers: utenti.count,
      totalCourses: corsi.count,
      totalSchedules: orari.count,
      usersByRole: perRuolo.reduce((acc, row) => {
        acc[row.role] = row.count;
        return acc;
      }, {}),
    };
  },

  async analyticsDettagliate() {
    const [
      schedulesByDay,
      topTeachers,
      topRooms,
      topSubjects,
      usersByCourse,
      recentActivity,
    ] = await Promise.all([
      dbAll(
        "SELECT day, COUNT(*) as count FROM schedules GROUP BY day ORDER BY CASE day WHEN 'Lunedì' THEN 1 WHEN 'Martedì' THEN 2 WHEN 'Mercoledì' THEN 3 WHEN 'Giovedì' THEN 4 WHEN 'Venerdì' THEN 5 WHEN 'Sabato' THEN 6 WHEN 'Domenica' THEN 7 END",
      ),
      dbAll(
        "SELECT teacher, COUNT(*) as count FROM schedules GROUP BY teacher ORDER BY count DESC LIMIT 10",
      ),
      dbAll(
        "SELECT room, COUNT(*) as count FROM schedules GROUP BY room ORDER BY count DESC LIMIT 10",
      ),
      dbAll(
        "SELECT subject, COUNT(*) as count FROM schedules GROUP BY subject ORDER BY count DESC LIMIT 10",
      ),
      dbAll(
        "SELECT c.name as course_name, COUNT(uc.user_id) as user_count FROM courses c LEFT JOIN user_courses uc ON c.id = uc.course_id GROUP BY c.id, c.name ORDER BY user_count DESC",
      ),
      dbAll(
        "SELECT date, COUNT(*) as count FROM schedules WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date DESC",
      ),
    ]);
    return {
      schedulesByDay,
      topTeachers,
      topRooms,
      topSubjects,
      usersByCourse,
      recentActivity,
    };
  },
};

module.exports = statsRepository;

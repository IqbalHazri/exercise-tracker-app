CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    reps INT,
    sets INT,
    duration INT,
    date DATE
);

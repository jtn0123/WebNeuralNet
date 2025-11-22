// Constants for magic numbers
export const CONSTANTS = {
    // Log management
    LOG_MAX_ENTRIES: 50,

    // CartPole physics and thresholds
    CART_WIDTH: 50,
    CART_HEIGHT: 30,
    WHEEL_RADIUS: 8,
    POLE_TIP_RADIUS: 10,
    ANGLE_ARC_RADIUS: 30,
    VELOCITY_SCALE: 20,
    ARROW_HEAD_SIZE: 8,
    GROUND_HEIGHT_RATIO: 0.7,
    TRACK_Y_RATIO: 0.7,
    CART_Y_RATIO: 0.7,

    // Pole color thresholds (ratio of angle to threshold)
    POLE_CRITICAL_THRESHOLD: 0.7,
    POLE_WARNING_THRESHOLD: 0.4,
    WARNING_DISPLAY_THRESHOLD: 0.7,

    // Reward shaping
    ANGLE_PENALTY: 0.05,
    POSITION_PENALTY: 0.001,
    FAILURE_REWARD: -1.0,

    // Training parameters
    INITIAL_EXPLORATION: 0.2,
    EXPLORATION_DECAY: 0.998,
    MIN_EXPLORATION: 0.05,
    DEFAULT_TRAINING_SPEED: 5,

    // Network visualization
    NODE_RADIUS: 7,
    NODE_SPACING_MIN: 25,

    // Rendering and visualization
    SVG_UPDATE_FREQUENCY: 3, // Update every N frames

    // History management
    SURVIVAL_HISTORY_MAX: 100,
    LOG_INTERVAL_EPISODES: 10,

    // State normalization
    MAX_X: 2.4,
    MAX_X_DOT: 4.0,
    MAX_THETA: 0.21,
    MAX_THETA_DOT: 4.0,

    // Feedback windows
    SURVIVAL_HISTORY_WINDOW: 10
};

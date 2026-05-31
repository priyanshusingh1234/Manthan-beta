export type Submission = {
    id: string;
    submission_url: string;
    self_marked_correct: boolean;
    status: string;
    points_awarded: number;
    checker_deadline: string | null;
    challenge_id: string | null;
};

export type WrittenQuestion = {
    id: string;
    title: string;
    body: string;
    points: number;
    time_limit: number;
    subject?: string;
    class_grade?: string;
    difficulty?: string;
    options?: string[];
    image_url?: string;
    image_path?: string;
    publicUrl?: string;
    teacherName?: string;
    teacherAvatar?: string;
    teacherUsername?: string;
    created_by: string;
};

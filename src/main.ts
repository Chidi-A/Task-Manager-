import './style.css';
// Modal Elements
const modalWrapper = document.querySelector('.modal-wrapper') as HTMLDivElement;
const modalForm = document.querySelector('.modal-form') as HTMLFormElement;
const newTaskBtn = document.querySelector(
  '.header button'
) as HTMLButtonElement; // "New Task" button
const cancelBtn = document.querySelector('.btn-secondary') as HTMLButtonElement; // Modal cancel button

// Form Input Elements
const taskTitleInput = document.querySelector(
  'input[type="text"]'
) as HTMLInputElement;
const taskDescInput = document.querySelector('textarea') as HTMLTextAreaElement;
const taskDateInput = document.querySelector(
  'input[type="date"]'
) as HTMLInputElement;
const taskTimeInput = document.querySelector(
  'input[type="time"]'
) as HTMLInputElement;

// Task List Elements
const taskList = document.querySelector('.task-list') as HTMLDivElement; // Container for tasks

// Filter Elements
const allTasksBtn = document.querySelector(
  '.filter-btn.active'
) as HTMLButtonElement;
const activeTasksBtn = document.querySelector(
  '.filter-btn:nth-child(2)'
) as HTMLButtonElement;
const completedTasksBtn = document.querySelector(
  '.filter-btn:nth-child(3)'
) as HTMLButtonElement;
const clearCompletedBtn = document.querySelector(
  '.clear-completed'
) as HTMLButtonElement;

// Get count elements
const totalTasksCount = document.querySelector(
  '.tasks-info h5'
) as HTMLHeadingElement;
const activeTasksCount = document.querySelector(
  '.filter-btn:nth-child(2)'
) as HTMLButtonElement;
const completedTasksCount = document.querySelector(
  '.filter-btn:nth-child(3)'
) as HTMLButtonElement;

interface TaskUpdate {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
}

class Task {
  private _id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  completed: boolean;
  private _createdAt: string;

  constructor(title: string, description: string, date: string, time: string) {
    this._id = Date.now();
    this.title = title;
    this.description = description;
    this.date = date;
    this.time = time;
    this.completed = false;
    this._createdAt = new Date().toISOString();
  }

  get id(): number {
    return this._id;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  toggleComplete(): void {
    this.completed = !this.completed;
  }

  update(newDetails: TaskUpdate): void {
    this.title = newDetails.title || this.title;
    this.description = newDetails.description || this.description;
    this.date = newDetails.date || this.date;
    this.time = newDetails.time || this.time;
  }
}

interface StorageInterface {
  KEY: string;
  save(tasks: Task[]): void;
  get(): Task[];
  addTask(task: Task): void;
  updateTask(updatedTask: Task): void;
  deleteTask(taskId: number): void;
  clear(): void;
}

const Storage: StorageInterface = {
  KEY: 'taskList',

  save(tasks: Task[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(tasks));
  },

  get(): Task[] {
    const tasksJSON = localStorage.getItem(this.KEY);
    const tasks = tasksJSON ? JSON.parse(tasksJSON) : [];

    return tasks.map((task: any) => {
      const newTask = new Task(
        task.title,
        task.description,
        task.date,
        task.time
      );
      Object.defineProperty(newTask, '_id', {
        value: task.id,
        writable: false,
      });
      newTask.completed = task.completed;
      Object.defineProperty(newTask, '_createdAt', {
        value: task.createdAt,
        writable: false,
      });

      return newTask;
    });
  },

  addTask(task: Task): void {
    const tasks = this.get();
    tasks.push(task);
    this.save(tasks);
  },

  updateTask(updatedTask: Task): void {
    const tasks = this.get();
    const index = tasks.findIndex((task) => task.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.save(tasks);
    }
  },

  deleteTask(taskId: number): void {
    const tasks = this.get();
    const filteredTasks = tasks.filter((task) => task.id !== taskId);
    this.save(filteredTasks);
  },

  clear(): void {
    localStorage.removeItem(this.KEY);
  },
};

let tasks: Task[] = Storage.get();

interface TaskCount {
  total: number;
  active: number;
  completed: number;
}

function getActiveTasks(): Task[] {
  return tasks.filter((task) => !task.completed);
}

function getCompletedTasks(): Task[] {
  return tasks.filter((task) => task.completed);
}

function getTaskCount(): TaskCount {
  return {
    total: tasks.length,
    active: getActiveTasks().length,
    completed: getCompletedTasks().length,
  };
}

function generateTaskHTML(task: Task): string {
  return `
        <div class="task-wrapper" data-id="${task.id}">
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-left">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <h4>${task.title}</h4>
                        <p>${task.description}</p>
                    </div>
                </div>
                <div class="task-actions">
                    <span class="material-icons edit-btn">edit</span>
                    <span class="material-icons delete-btn">delete</span>
                </div>
            </div>
            <div class="task-time">
                <span>Today</span>
                <span>${task.time}</span>
            </div>
        </div>
    `;
}

interface FormData {
  title: string;
  description: string;
  date: string;
  time: string;
}

function validateFormData(data: FormData): string[] {
  const errors: string[] = [];

  if (!data.title.trim()) errors.push('Title is required');
  if (!data.description.trim()) errors.push('Description is required');
  if (!data.date) errors.push('Date is required');
  if (!data.time) errors.push('Time is required');

  return errors;
}

function showErrors(errors: string[]): void {
  alert(errors.join('\n'));
}

let isEditing: boolean = false;
let taskBeingEdited: Task | null = null;

function handleFormSubmit(e: Event): void {
  e.preventDefault();

  const formData: FormData = {
    title: taskTitleInput.value,
    description: taskDescInput.value,
    date: taskDateInput.value,
    time: taskTimeInput.value,
  };

  const errors = validateFormData(formData);

  if (errors.length > 0) {
    showErrors(errors);
    return;
  }

  if (isEditing && taskBeingEdited) {
    taskBeingEdited.update({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
    });

    const taskElement = document.querySelector(
      `[data-id="${taskBeingEdited.id}"]`
    ) as HTMLElement;

    if (taskElement) {
      taskElement.innerHTML = generateTaskHTML(taskBeingEdited);
    }

    Storage.save(tasks);

    isEditing = false;
    taskBeingEdited = null;
  } else {
    const newTask = new Task(
      formData.title,
      formData.description,
      formData.date,
      formData.time
    );

    tasks.push(newTask);
    Storage.save(tasks);

    addTaskToDOM(newTask);
  }

  updateTaskCounts();

  modalForm.reset();
  hideModal();
}

modalForm.onsubmit = handleFormSubmit;

function showModal(): void {
  modalWrapper.classList.add('show');
}

function hideModal(): void {
  modalWrapper.classList.remove('show');

  isEditing = false;
  taskBeingEdited = null;

  setTimeout(() => {
    modalForm.reset();
  }, 300);
}

newTaskBtn.addEventListener('click', showModal);

cancelBtn.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  isEditing = false;
  taskBeingEdited = null;
  modalForm.reset();
  hideModal();
});

modalWrapper.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (
    target.classList.contains('modal-bg') ||
    target.classList.contains('modal-wrapper')
  ) {
    e.preventDefault();

    isEditing = false;
    taskBeingEdited = null;
    modalForm.reset();
    hideModal();
  }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && modalWrapper.classList.contains('show')) {
    hideModal();
  }
});

function addTaskToDOM(task: Task): void {
  const taskHTML = generateTaskHTML(task);
  taskList.insertAdjacentHTML('beforeend', taskHTML);
}

function renderAllTasks(): void {
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    addTaskToDOM(task);
  });
}

function updateTaskCounts(): void {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;

  totalTasksCount.textContent = `You have ${active} tasks left to complete today`;
  activeTasksCount.innerHTML = `Active <span class="count">${active}</span>`;
  completedTasksCount.innerHTML = `Completed <span class="count">${completed}</span>`;
  allTasksBtn.innerHTML = `All <span class="count">${total}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderAllTasks();
  updateTaskCounts();
  addTaskListeners();
  addFilterListeners();
  addClearCompletedListener();
  filterTasks('all');
});

function addTaskListeners(): void {
  taskList.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    const taskWrapper = target.closest('.task-wrapper');
    if (!taskWrapper) return;

    const taskId = parseInt((taskWrapper as HTMLElement).dataset.id || '0');
    const task = tasks.find((t) => t.id === taskId);

    if (target.classList.contains('delete-btn')) {
      deleteTask(taskId);
    }

    if (target.classList.contains('edit-btn') && task) {
      editTask(task);
    }

    taskList.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const taskWrapper = target.closest('.task-wrapper');
        const taskItem = target.closest('.task-item');

        if (!taskWrapper || !taskItem) return;

        const taskId = parseInt((taskWrapper as HTMLElement).dataset.id || '0');
        const task = tasks.find((t) => t.id === taskId);

        if (task) {
          task.completed = target.checked;

          taskItem.classList.toggle('completed', task.completed);
          Storage.save(tasks);

          updateTaskCounts();
        }
      }
    });
  });
}

type FilterType = 'all' | 'active' | 'completed';

function deleteTask(taskId: number): void {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter((task) => task.id !== taskId);

    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (taskElement) {
      taskElement.remove();
    }

    Storage.save(tasks);
    updateTaskCounts();
  }
}

function editTask(task: Task): void {
  isEditing = true;
  taskBeingEdited = task;

  taskTitleInput.value = task.title;
  taskDescInput.value = task.description;
  taskDateInput.value = task.date;
  taskTimeInput.value = task.time;

  showModal();
}

// Add CSS for completed state
const style = document.createElement('style');
style.textContent = `
    /* Completed task style */
    .task-item.completed .task-content {
        text-decoration: line-through;
        opacity: 0.7;
    }

    /* Action buttons style */
    .task-actions .material-icons {
        cursor: pointer;
    }

    .task-actions .edit-btn:hover {
        color: var(--base-dark);
    }

    .task-actions .delete-btn:hover {
        color: #8c1d18;
    }
`;
document.head.appendChild(style);

function addFilterListeners(): void {
  allTasksBtn.addEventListener('click', () => filterTasks('all'));
  activeTasksBtn.addEventListener('click', () => filterTasks('active'));
  completedTasksBtn.addEventListener('click', () => filterTasks('completed'));
}

function filterTasks(filterType: FilterType): void {
  allTasksBtn.classList.remove('active');
  activeTasksBtn.classList.remove('active');
  completedTasksBtn.classList.remove('active');

  switch (filterType) {
    case 'all':
      allTasksBtn.classList.add('active');
      break;
    case 'active':
      activeTasksBtn.classList.add('active');
      break;
    case 'completed':
      completedTasksBtn.classList.add('active');
      break;
  }

  const taskElements = document.querySelectorAll('.task-wrapper');

  taskElements.forEach((taskElement) => {
    const taskId = parseInt((taskElement as HTMLElement).dataset.id || '0');
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    switch (filterType) {
      case 'all':
        (taskElement as HTMLElement).style.display = 'block';
        break;
      case 'active':
        (taskElement as HTMLElement).style.display = task.completed
          ? 'none'
          : 'block';
        break;
      case 'completed':
        (taskElement as HTMLElement).style.display = task.completed
          ? 'block'
          : 'none';
        break;
    }
  });
}

function clearCompletedTasks(): void {
  tasks = tasks.filter((task) => !task.completed);

  const completedElements = document.querySelectorAll(
    '.task-wrapper .task-item.completed'
  );
  completedElements.forEach((element) => {
    const wrapper = element.closest('.task-wrapper');
    if (wrapper) {
      wrapper.remove();
    }
  });

  Storage.save(tasks);
  updateTaskCounts();
}

function addClearCompletedListener(): void {
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);
}

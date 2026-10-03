import React, { useState } from 'react';
import { Task } from '../models/Task';
import HomeScreen from '../screens/HomeScreen';
import AddEditTaskScreen from '../screens/AddEditTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

type Screen =
  | { name: 'Home' }
  | { name: 'AddTask' }
  | { name: 'EditTask'; task: Task }
  | { name: 'TaskDetail'; task: Task };

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ name: 'Home' });

  const navigateToHome = () => setCurrentScreen({ name: 'Home' });
  const navigateToAdd = () => setCurrentScreen({ name: 'AddTask' });
  const navigateToEdit = (task: Task) =>
    setCurrentScreen({ name: 'EditTask', task });
  const navigateToDetail = (task: Task) =>
    setCurrentScreen({ name: 'TaskDetail', task });

  switch (currentScreen.name) {
    case 'Home':
      return (
        <HomeScreen
          onNavigateToAdd={navigateToAdd}
          onNavigateToEdit={navigateToEdit}
          onNavigateToDetail={navigateToDetail}
        />
      );
    case 'AddTask':
      return <AddEditTaskScreen onGoBack={navigateToHome} />;
    case 'EditTask':
      return (
        <AddEditTaskScreen
          task={currentScreen.task}
          onGoBack={navigateToHome}
        />
      );
    case 'TaskDetail':
      return (
        <TaskDetailScreen
          task={currentScreen.task}
          onGoBack={navigateToHome}
          onNavigateToEdit={navigateToEdit}
        />
      );
    default:
      return (
        <HomeScreen
          onNavigateToAdd={navigateToAdd}
          onNavigateToEdit={navigateToEdit}
          onNavigateToDetail={navigateToDetail}
        />
      );
  }
}

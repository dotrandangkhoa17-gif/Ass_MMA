import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Task } from '../models/Task';
import HomeScreen from '../screens/HomeScreen';
import TeamsScreen from '../screens/TeamsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEditTaskScreen from '../screens/AddEditTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import BottomTabBar, { TabType } from '../components/BottomTabBar';

type Screen =
  | { name: 'Main' }
  | { name: 'AddTask' }
  | { name: 'EditTask'; task: Task }
  | { name: 'TaskDetail'; task: Task };

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ name: 'Main' });
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const navigateToHome = () => setCurrentScreen({ name: 'Main' });
  const navigateToAdd = () => setCurrentScreen({ name: 'AddTask' });
  const navigateToEdit = (task: Task) =>
    setCurrentScreen({ name: 'EditTask', task });
  const navigateToDetail = (task: Task) =>
    setCurrentScreen({ name: 'TaskDetail', task });

  if (currentScreen.name === 'AddTask') {
    return <AddEditTaskScreen onGoBack={navigateToHome} />;
  }

  if (currentScreen.name === 'EditTask') {
    return (
      <AddEditTaskScreen
        task={currentScreen.task}
        onGoBack={navigateToHome}
      />
    );
  }

  if (currentScreen.name === 'TaskDetail') {
    return (
      <TaskDetailScreen
        task={currentScreen.task}
        onGoBack={navigateToHome}
        onNavigateToEdit={navigateToEdit}
      />
    );
  }

  const renderTabScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToAdd={navigateToAdd}
            onNavigateToEdit={navigateToEdit}
            onNavigateToDetail={navigateToDetail}
          />
        );
      case 'teams':
        return <TeamsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return (
          <HomeScreen
            onNavigateToAdd={navigateToAdd}
            onNavigateToEdit={navigateToEdit}
            onNavigateToDetail={navigateToDetail}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContent}>{renderTabScreen()}</View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContent: {
    flex: 1,
  },
});

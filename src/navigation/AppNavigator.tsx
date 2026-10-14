import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Task } from '../models/Task';
import { Team } from '../models/Team';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import TeamsScreen from '../screens/TeamsScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import TeamChatScreen from '../screens/TeamChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEditTaskScreen from '../screens/AddEditTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import BottomTabBar, { TabType } from '../components/BottomTabBar';

type AppScreen =
  | { name: 'Main' }
  | { name: 'AddTask'; initialTeam?: Team }
  | { name: 'EditTask'; task: Task }
  | { name: 'TaskDetail'; task: Task }
  | { name: 'TeamDetail'; team: Team }
  | { name: 'TeamChat'; team: Team };

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>({ name: 'Main' });
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <Text style={styles.splashIcon}>⚡</Text>
        </View>
        <Text style={styles.splashTitle}>TaskMaster Pro</Text>
        <ActivityIndicator size="large" color="#6366F1" style={styles.splashSpinner} />
        <Text style={styles.splashSubtitle}>Đang đồng bộ dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  // Auth stack (Unauthenticated)
  if (!user) {
    if (authScreen === 'signup') {
      return <SignUpScreen onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return <LoginScreen onNavigateToSignUp={() => setAuthScreen('signup')} />;
  }

  // Navigation handlers
  const navigateToHome = () => setCurrentScreen({ name: 'Main' });
  const navigateToAdd = (initialTeam?: Team) =>
    setCurrentScreen({ name: 'AddTask', initialTeam });
  const navigateToEdit = (task: Task) =>
    setCurrentScreen({ name: 'EditTask', task });
  const navigateToDetail = (task: Task) =>
    setCurrentScreen({ name: 'TaskDetail', task });
  const navigateToTeamDetail = (team: Team) =>
    setCurrentScreen({ name: 'TeamDetail', team });
  const navigateToChat = (team: Team) =>
    setCurrentScreen({ name: 'TeamChat', team });

  // Stack Screens (Authenticated)
  if (currentScreen.name === 'AddTask') {
    return (
      <AddEditTaskScreen
        initialTeam={currentScreen.initialTeam}
        onGoBack={navigateToHome}
      />
    );
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

  if (currentScreen.name === 'TeamDetail') {
    return (
      <TeamDetailScreen
        team={currentScreen.team}
        onGoBack={() => {
          setActiveTab('teams');
          navigateToHome();
        }}
        onNavigateToChat={navigateToChat}
        onNavigateToAddTask={(team) => navigateToAdd(team)}
        onNavigateToEditTask={navigateToEdit}
        onNavigateToTaskDetail={navigateToDetail}
      />
    );
  }

  if (currentScreen.name === 'TeamChat') {
    return (
      <TeamChatScreen
        team={currentScreen.team}
        onGoBack={() => navigateToTeamDetail(currentScreen.team)}
      />
    );
  }

  // Main Tab Screens
  const renderTabScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToAdd={() => navigateToAdd()}
            onNavigateToEdit={navigateToEdit}
            onNavigateToDetail={navigateToDetail}
          />
        );
      case 'teams':
        return (
          <TeamsScreen
            onNavigateToTeamDetail={navigateToTeamDetail}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      default:
        return (
          <HomeScreen
            onNavigateToAdd={() => navigateToAdd()}
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
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  splashBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  splashIcon: {
    fontSize: 36,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },
  splashSpinner: {
    marginBottom: 12,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

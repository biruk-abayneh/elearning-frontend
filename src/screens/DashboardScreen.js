import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Card } from 'react-native';
import { getDashboardData } from '../api/contentService';

const DashboardScreen = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        getDashboardData().then(response => {
            setData(response);
        });
    }, []);

    if (!data) return <Text>Loading stats...</Text>;

    return (
        <View style={styles.container}>
            {/* Rank Header */}
            <View style={styles.rankCard}>
                <Text style={styles.rankLabel}>Global Rank</Text>
                <Text style={styles.rankNumber}>#{data.rank?.rank || 'N/A'}</Text>
                <Text style={styles.points}>{data.rank?.total_score || 0} Total Points</Text>
            </View>

            <Text style={styles.title}>Recent Activity</Text>
            <FlatList
                data={data.attempts}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.attemptItem}>
                        <View>
                            <Text style={styles.subjectText}>{item.chapters?.subjects?.name}</Text>
                            <Text style={styles.chapterText}>{item.chapters?.title}</Text>
                        </View>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreText}>{item.score}/{item.total_questions}</Text>
                            <Text style={styles.percentText}>{Math.round(item.percentage)}%</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    rankCard: { backgroundColor: '#2196f3', padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
    rankLabel: { color: '#fff', fontSize: 16 },
    rankNumber: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
    points: { color: '#e3f2fd' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    attemptItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    subjectText: { fontSize: 12, color: '#666' },
    chapterText: { fontSize: 16, fontWeight: 'bold' },
    scoreText: { fontSize: 16, fontWeight: 'bold', color: '#2196f3', textAlign: 'right' },
    percentText: { fontSize: 12, color: '#4caf50', textAlign: 'right' }
});

export default DashboardScreen;
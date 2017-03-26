import React, { PropTypes } from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';

export default function Day(props) {
  const { day, styles, onPressDay } = props;
  return(
    <View style={styles.dayWrapper}>
      <View style={styles.dayButton}>
        <TouchableOpacity
          style={styles.dayButton}
          onPress={() => onPressDay(day) }>
          <Text style={styles.dayLabel}>
            { day }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

Day.propTypes = {
  styles: PropTypes.shape({}),
  day: PropTypes.number,
  onPressDay: PropTypes.func,
}
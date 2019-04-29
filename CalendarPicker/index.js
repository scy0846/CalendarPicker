import React, { Component } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { makeStyles } from './makeStyles';
import { Utils } from './Utils';
import HeaderControls from './HeaderControls';
import Weekdays from './Weekdays';
import DaysGridView from './DaysGridView';
import MonthsGridView from './MonthsGridView';
import MonthsViewHeader from './MonthsViewHeader'
import Swiper from './Swiper';
import moment from 'moment';
import YearsGridView from "./YearsGridView";
import YearsViewHeader from "./YearsViewHeader";

const SWIPE_LEFT = 'SWIPE_LEFT';
const SWIPE_RIGHT = 'SWIPE_RIGHT';

const _swipeConfig = {
  velocityThreshold: 0.3,
  directionalOffsetThreshold: 80
};

export default class CalendarPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMonth: null,
      currentYear: null,
      selectedStartDate: props.selectedStartDate || null,
      selectedEndDate: props.selectedEndDate || null,
      styles: {},
      currentView: "days",
      ...this.updateScaledStyles(props),
      ...this.updateMonthYear(props.initialDate)
    };
    this.updateScaledStyles = this.updateScaledStyles.bind(this);
    this.updateMonthYear = this.updateMonthYear.bind(this);
    this.handleOnPressPrevious = this.handleOnPressPrevious.bind(this);
    this.handleOnPressNext = this.handleOnPressNext.bind(this);
    this.handleOnPressDay = this.handleOnPressDay.bind(this);
    this.handleOnPressMonth = this.handleOnPressMonth.bind(this);
    this.handleOnPressYear = this.handleOnPressYear.bind(this);
    this.handleOnSelectMonth = this.handleOnSelectMonth.bind(this);
    this.handleOnMonthViewNext = this.handleOnMonthViewNext.bind(this);
    this.handleOnMonthViewPrevious = this.handleOnMonthViewPrevious.bind(this);
    this.handleOnSelectYear = this.handleOnSelectYear.bind(this);
    this.handleOnYearViewNext = this.handleOnYearViewNext.bind(this);
    this.handleOnYearViewPrevious = this.handleOnYearViewPrevious.bind(this);
    this.onSwipe = this.onSwipe.bind(this);
    this.resetSelections = this.resetSelections.bind(this);
  }

  static defaultProps = {
    initialDate: moment(),
    scaleFactor: 375,
    enableSwipe: true,
    onDateChange: () => {
      console.log("onDateChange() not provided");
    },
    enableDateChange: true
  };

  componentDidUpdate(prevProps, prevState) {
    let newStyles = {};
    let doStateUpdate = false;

    if (
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      newStyles = this.updateScaledStyles(this.props);
      doStateUpdate = true;
    }

    let newMonthYear = {};
    if (!moment(prevProps.initialDate).isSame(this.props.initialDate, "day")) {
      newMonthYear = this.updateMonthYear(this.props.initialDate);
      doStateUpdate = true;
    }

    let selectedDateRanges = {};
    if (
      (this.props.selectedStartDate &&
        !moment(prevState.selectedStartDate).isSame(
          this.props.selectedStartDate,
          "day"
        )) ||
      (this.props.selectedEndDate &&
        !moment(prevState.selectedEndDate).isSame(
          this.props.selectedEndDate,
          "day"
        ))
    ) {
      const { selectedStartDate = null, selectedEndDate = null } = this.props;
      selectedDateRanges = {
        selectedStartDate,
        selectedEndDate
      };
      doStateUpdate = true;
    }

    if (doStateUpdate) {
      this.setState({ ...newStyles, ...newMonthYear, ...selectedDateRanges });
    }
  }

  updateScaledStyles(props) {
    const {
      scaleFactor,
      selectedDayColor,
      selectedDayTextColor,
      todayBackgroundColor,
      width,
      height,
      dayShape,
      monthBackgroundColor,
      yearBackgroundColor
    } = props;

    // The styles in makeStyles are intially scaled to this width
    const containerWidth = width ? width : Dimensions.get("window").width;
    const containerHeight = height ? height : Dimensions.get("window").height;
    const initialScale =
      Math.min(containerWidth, containerHeight) / scaleFactor;
    return {
      styles: makeStyles(
        initialScale,
        selectedDayColor,
        selectedDayTextColor,
        todayBackgroundColor,
        dayShape,
        monthBackgroundColor,
        yearBackgroundColor
      )
    };
  }

  updateMonthYear(initialDate = this.props.initialDate) {
    return {
      currentMonth: parseInt(moment(initialDate).month()),
      currentYear: parseInt(moment(initialDate).year())
    };
  }

  handleOnPressDay(day) {
    const {
      currentYear,
      currentMonth,
      selectedStartDate,
      selectedEndDate
    } = this.state;

    const { allowRangeSelection, onDateChange, enableDateChange } = this.props;

    if (!enableDateChange) {
      return;
    }

    const date = moment({ year: currentYear, month: currentMonth, day });

    if (
      allowRangeSelection &&
      selectedStartDate &&
      date.isSameOrAfter(selectedStartDate) &&
      !selectedEndDate
    ) {
      this.setState({
        selectedEndDate: date
      });
      // propagate to parent date has changed
      onDateChange(date, Utils.END_DATE);
    } else {
      this.setState({
        selectedStartDate: date,
        selectedEndDate: null
      });
      // propagate to parent date has changed
      onDateChange(date, Utils.START_DATE);
    }
  }

  handleOnSelectMonth(month) {
    const {
      currentYear
    } = this.state;

    const { enableDateChange } = this.props;

    if (!enableDateChange) {
      return;
    }
    this.setState({
      currentMonth: parseInt(month),
      currentYear: parseInt(currentYear),
      currentView: "days"
    });
  }

  handleOnSelectYear(year) {
    const { enableDateChange } = this.props;

    if (!enableDateChange) {
      return;
    }
    this.setState({
      currentYear: parseInt(year),
      currentView: "days"
    });
  }

  handleOnPressPrevious() {
    let { currentMonth, currentYear } = this.state;
    let previousMonth = currentMonth - 1;
    // if previousMonth is negative it means the current month is January,
    // so we have to go back to previous year and set the current month to December
    if (previousMonth < 0) {
      previousMonth = 11;
      currentYear -= 1; // decrement year
      this.setState({
        currentMonth: parseInt(previousMonth), // setting month to December
        currentYear: parseInt(currentYear)
      });
    } else {
      this.setState({
        currentMonth: parseInt(previousMonth),
        currentYear: parseInt(currentYear)
      });
    }
    this.props.onMonthChange &&
      this.props.onMonthChange(
        moment({ year: currentYear, month: previousMonth })
      );
  }

  handleOnPressNext() {
    let { currentMonth, currentYear } = this.state;
    let nextMonth = currentMonth + 1;
    // if nextMonth is greater than 11 it means the current month is December,
    // so we have to go forward to the next year and set the current month to January
    if (nextMonth > 11) {
      nextMonth = 0;
      currentYear += 1; // increment year
      this.setState({
        currentMonth: parseInt(nextMonth), // setting month to January
        currentYear: parseInt(currentYear)
      });
    } else {
      this.setState({
        currentMonth: parseInt(nextMonth),
        currentYear: parseInt(currentYear)
      });
    }
    this.props.onMonthChange && this.props.onMonthChange(moment({year: currentYear, month: nextMonth}));
  }

  handleOnMonthViewPrevious() {
    let { currentYear } = this.state;
    let previousYear = currentYear - 1;
    if(previousYear < 1900){
      previousYear = 1900
    }
    this.setState({
      currentYear: parseInt(previousYear)
    });
  }

  handleOnMonthViewNext() {
    let { currentYear } = this.state;
    let nextYear = currentYear + 1;
    this.setState({
      currentYear: parseInt(nextYear)
    });
  }

  handleOnYearViewPrevious() {
    let { currentYear } = this.state;
    let previousYear = currentYear - 25;
    if(previousYear < 1900){
      previousYear = 1900
    }
    this.setState({
      currentYear: parseInt(previousYear)
    });
  }

  handleOnYearViewNext() {
    let { currentYear } = this.state;
    let nextYear = currentYear + 25;
    this.setState({
      currentYear: parseInt(nextYear)
    });
  }

  handleOnPressMonth() {
    this.setState({
      currentView: "months"
    });
  }

  handleOnPressYear() {
    this.setState({
      currentView: "years"
    });
  }

  onSwipe(gestureName) {
    if (typeof this.props.onSwipe === "function") {
      this.props.onSwipe(gestureName);
      return;
    }
    switch (gestureName) {
      case SWIPE_LEFT:
        this.handleOnPressNext();
        break;
      case SWIPE_RIGHT:
        this.handleOnPressPrevious();
        break;
    }
  }

  resetSelections() {
    this.setState({
      selectedStartDate: null,
      selectedEndDate: null
    });
  }

  render() {
    const {
      currentMonth,
      currentYear,
      selectedStartDate,
      selectedEndDate,
      styles
    } = this.state;

    const {
      allowRangeSelection,
      startFromMonday,
      initialDate,
      minDate,
      maxDate,
      weekdays,
      months,
      previousTitle,
      nextTitle,
      textStyle,
      todayTextStyle,
      selectedDayStyle,
      selectedRangeStartStyle,
      selectedRangeStyle,
      selectedRangeEndStyle,
      disabledDates,
      minRangeDuration,
      maxRangeDuration,
      swipeConfig,
      customDatesStyles,
      enableDateChange
    } = this.props;

    let disabledDatesTime = [];

    // Convert input date into timestamp
    if (disabledDates && Array.isArray(disabledDates)) {
      disabledDates.map(date => {
        let thisDate = moment(date);
        thisDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        disabledDatesTime.push(thisDate.valueOf());
      });
    }

    let minRangeDurationTime = [];

    if (allowRangeSelection && minRangeDuration) {
      if (Array.isArray(minRangeDuration)) {
        minRangeDuration.map(minRangeDuration => {
          let thisDate = moment(minRangeDuration.date);
          thisDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          minRangeDurationTime.push({
            date: thisDate.valueOf(),
            minDuration: minRangeDuration.minDuration
          });
        });
      } else {
        minRangeDurationTime = minRangeDuration;
      }
    }

    let maxRangeDurationTime = [];

    if (allowRangeSelection && maxRangeDuration) {
      if (Array.isArray(maxRangeDuration)) {
        maxRangeDuration.map(maxRangeDuration => {
          let thisDate = moment(maxRangeDuration.date);
          thisDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          maxRangeDurationTime.push({
            date: thisDate.valueOf(),
            maxDuration: maxRangeDuration.maxDuration
          });
        });
      } else {
        maxRangeDurationTime = maxRangeDuration;
      }
    }

    return (
      <Swiper
        onSwipe={direction => this.props.enableSwipe && this.onSwipe(direction)}
        config={{ ..._swipeConfig, ...swipeConfig }}
      >
        {this.state.currentView === "months" &&
        <View styles={styles.calendar}>
          <MonthsViewHeader
            styles={styles}
            currentYear={currentYear}
            initialDate={moment(initialDate)}
            months={months}
            previousTitle={previousTitle}
            nextTitle={nextTitle}
            textStyle={textStyle}
            onMonthViewPrevious={this.handleOnMonthViewPrevious}
            onMonthViewNext={this.handleOnMonthViewNext}
            onPressYear={this.handleOnPressYear}
          />
          <MonthsGridView
            year={currentYear}
            styles={styles}
            onSelectMonth={this.handleOnSelectMonth}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            textStyle={textStyle}
          />
        </View>
        }
        {this.state.currentView === "years" &&
        <View styles={styles.calendar}>
          <YearsViewHeader
            styles={styles}
            initialDate={moment(initialDate)}
            previousTitle={previousTitle}
            nextTitle={nextTitle}
            textStyle={textStyle}
            onYearViewPrevious={this.handleOnYearViewPrevious}
            onYearViewNext={this.handleOnYearViewNext}
          />
          <YearsGridView
            year={currentYear}
            styles={styles}
            onSelectYear={this.handleOnSelectYear}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            textStyle={textStyle}
          />
        </View>
        }
        {this.state.currentView === "days" &&
        <View styles={styles.calendar}>
          <HeaderControls
            styles={styles}
            currentMonth={currentMonth}
            currentYear={currentYear}
            initialDate={moment(initialDate)}
            onPressPrevious={this.handleOnPressPrevious}
            onPressNext={this.handleOnPressNext}
            onPressMonth={this.handleOnPressMonth}
            onPressYear={this.handleOnPressYear}
            months={months}
            previousTitle={previousTitle}
            nextTitle={nextTitle}
            textStyle={textStyle}
          />
          <Weekdays
            styles={styles}
            startFromMonday={startFromMonday}
            weekdays={weekdays}
            textStyle={textStyle}
          />
          <DaysGridView
            enableDateChange={enableDateChange}
            month={currentMonth}
            year={currentYear}
            styles={styles}
            onPressDay={this.handleOnPressDay}
            disabledDates={disabledDatesTime}
            minRangeDuration={minRangeDurationTime}
            maxRangeDuration={maxRangeDurationTime}
            startFromMonday={startFromMonday}
            allowRangeSelection={allowRangeSelection}
            selectedStartDate={selectedStartDate && moment(selectedStartDate)}
            selectedEndDate={selectedEndDate && moment(selectedEndDate)}
            minDate={minDate && moment(minDate)}
            maxDate={maxDate && moment(maxDate)}
            textStyle={textStyle}
            todayTextStyle={todayTextStyle}
            selectedDayStyle={selectedDayStyle}
            selectedRangeStartStyle={selectedRangeStartStyle}
            selectedRangeStyle={selectedRangeStyle}
            selectedRangeEndStyle={selectedRangeEndStyle}
            customDatesStyles={customDatesStyles}
          />
        </View>
        }
      </Swiper>
    );
  }
}